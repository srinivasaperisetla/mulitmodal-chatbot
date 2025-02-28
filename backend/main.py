import asyncio
import json
import os
import io
import websockets
from google import genai
import base64

from pydub import AudioSegment
import google.generativeai as generative
import wave
# import ssl

from dotenv import load_dotenv
print("STARTING BACKEND SERVER")

load_dotenv()  # Load environment variables from .env
api_key = os.getenv("GOOGLE_API_KEY")

print(f"GOOGLE_API_KEY from env: {api_key}")  # Debugging

if not api_key:
    raise ValueError("API key not found. Ensure it's defined in the .env file.")

generative.configure(api_key=os.environ['GOOGLE_API_KEY'])


MODEL = "gemini-2.0-flash-exp"  
TRANSCRIPTION_MODEL = "gemini-1.5-flash-8b"

# os.environ["SSL_CERT_FILE"] = "/opt/homebrew/opt/openssl@3/etc/openssl/cert.pem"
# ssl_context = ssl._create_unverified_context()

client = genai.Client(
  http_options={
    'api_version': 'v1alpha',
    # 'ssl_context': ssl_context,
  }
)

# Custom Functions for calling:
def set_light_values(brightness, color_temp):

  return {
    "brightness": brightness,
    "colorTemperature": color_temp,
  }

tool_set_light_values = {
  "function_declarations": [
    {
      "name": "set_light_values",
      "description": "Set the brightness and color temperature of a room light.",
      "parameters": {

        "type": "OBJECT",

        "properties": {

          "brightness": {
            "type": "NUMBER",
            "description": "Light level from 0 to 100. Zero is off and 100 is full brightness"
          },

          "color_temp": {
            "type": "STRING",
            "description": "Color temperature of the light fixture, which can be `daylight`, `cool` or `warm`."
          }

        },
        "required": ["brightness", "color_temp"]
      }
    }
  ]
}

async def gemini_session_handler(client_websocket: websockets.WebSocketServerProtocol):
  """Handles the interaction with Gemini API within a websocket session."""
  try:
    config_message = await client_websocket.recv()
    config_data = json.loads(config_message)
    config = config_data.get("setup", {})
    
    config["tools"] = [tool_set_light_values]

    config["system_instruction"] = """You are a helpful assistant for screen sharing sessions. Your role is to: 
                                      1) Analyze and describe the content being shared on screen 
                                      2) Answer questions about the shared content 
                                      3) Provide relevant information and context about what's being shown 
                                      4) Assist with technical issues related to screen sharing 
                                      5) Maintain a professional and helpful tone. Focus on being concise and clear in your responses.""" 

    async with client.aio.live.connect(model=MODEL, config=config) as session:
      print("Connected to Gemini API")

      async def send_to_gemini():
        """Sends messages from the client websocket to the Gemini API."""
        try:
          async for message in client_websocket:
            try:
              data = json.loads(message)
              if "realtime_input" in data:
                for chunk in data["realtime_input"]["media_chunks"]:
                  print(chunk['mime_type'])
                  if chunk["mime_type"] == "audio/pcm":
                    await session.send({"mime_type": "audio/pcm", "data": chunk["data"]})
                  elif chunk["mime_type"] == "image/jpeg":
                    await session.send({"mime_type": "image/jpeg", "data": chunk["data"]})
                  elif chunk["mime_type"] == "text":
                    pass
                    
            except Exception as e:
              print(f"Error sending to Gemini: {e}")
          print("Client connection closed (send)")
        except Exception as e:
          print(f"Error sending to Gemini: {e}")
        finally:
          print("send_to_gemini closed")

      async def receive_from_gemini():
        """Receives responses from the Gemini API and forwards them to the client."""
        try:
          while True:
            try:
              print("Receiving from Gemini")
              async for response in session.receive():
                if response.server_content is None:
                  if response.tool_call is not None:
                    #handle the tool call
                    print(f"Tool call received: {response.tool_call}")
                    function_calls = response.tool_call.function_calls
                    function_responses = []
                    
                    for function_call in function_calls:
                      name = function_call.name
                      args = function_call.args
                      # Extract the numeric part from Gemini's function call ID
                      call_id = function_call.id

                      if name == "set_light_values":
                        try:
                          result = set_light_values(int(args["brightness"]), args["color_temp"])
                          function_responses.append(
                            {
                              "name": name,
                              # "response": {"result": "The light is broken."},
                              "response": {"result": result},
                              "id": call_id  
                            }
                          )
                          await client_websocket.send(json.dumps({"text": json.dumps(function_responses)}))
                          print("Function executed")
                        except Exception as e:
                          print(f"Error executing function: {e}")
                          continue
                    
                    print(f"function_responses: {function_responses}")
                    await session.send(function_responses)
                    continue

                model_turn = response.server_content.model_turn
                if model_turn:
                  for part in model_turn.parts:
                    if hasattr(part, 'text') and part.text is not None:
                      await client_websocket.send(json.dumps({"text": part.text}))
                    elif hasattr(part, 'inline_data') and part.inline_data is not None:
                      base64_audio = base64.b64encode(part.inline_data.data).decode('utf-8')
                      await client_websocket.send(json.dumps({"audio": base64_audio}))

                      # Accumulate Audio Data here:
                      if not hasattr(session, 'audio_data'):
                        session.audio_data = b''
                      session.audio_data += part.inline_data.data

                      print("Audio received")

                if response.server_content.turn_complete:
                  print("\n<Turn complete>")
                  transcribed_text = transcribe_audio(session.audio_data)
                  if transcribed_text:
                    await client_websocket.send(json.dumps({
                      "text": transcribed_text
                    }))
                  #clear the session audio
                  session.audio_data = b''
            except websockets.exceptions.ConnectionClosedOK:
              print("Client connection closed normally (receive)")
              break
            except Exception as e:
              print(f"Error receiving from Gemini: {e}")
              break
        except Exception as e:
          print(f"Error receiving from Gemini: {e}")
        finally:
          print("Gemini connection closed (receive)")

      send_task = asyncio.create_task(send_to_gemini())
      receive_task = asyncio.create_task(receive_from_gemini())
      await asyncio.gather(send_task, receive_task)

  except Exception as e:
    print(f"Error in Gemini session: {e}")
  finally:
    print("Gemini session closed.")

def transcribe_audio(audio_data):
  """Transcribes audio using Gemini 1.5 Flash."""
  try:
    if not audio_data:
      return "No audio data received."

    mp3_audio_base64 = convert_pcm_to_mp3(audio_data)
    if not mp3_audio_base64:
      return "Audio conversion failed."
    
    # Create a client specific for transcription (assuming Gemini 1.5 flash)
    transcription_client = generative.GenerativeModel(model_name=TRANSCRIPTION_MODEL)

    prompt = """Generate a transcript of the speech. 
    Please do not include any other text in the response. 
    If you cannot hear the speech, please only say '<Not recognizable>'."""

    response = transcription_client.generate_content(
      [
        prompt,
        {
          "mime_type": "audio/mp3",
          "data": base64.b64decode(mp3_audio_base64),
        }
      ]
    )
    return response.text

  except Exception as e:
    print(f"Transcription error: {e}")
    return "Transcription failed.", None

def convert_pcm_to_mp3(pcm_data):
  """Converts PCM audio to base64 encoded MP3."""
  try:
    # Create a WAV in memory first
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
      wav_file.setnchannels(1)  # mono
      wav_file.setsampwidth(2)  # 16-bit]
      wav_file.setframerate(24000)  # 24kHz
      wav_file.writeframes(pcm_data)

    # Reset buffer position
    wav_buffer.seek(0)

    # Convert WAV to MP3
    audio_segment = AudioSegment.from_wav(wav_buffer)

    # Export as MP3
    mp3_buffer = io.BytesIO()
    audio_segment.export(mp3_buffer, format="mp3", codec="libmp3lame")

    # Convert to base64
    mp3_base64 = base64.b64encode(mp3_buffer.getvalue()).decode('utf-8')
    return mp3_base64
  
  except Exception as e:
    print(f"Error converting PCM to MP3: {e}")
    return None

async def main():
    print("Running WebSocket server on ws://0.0.0.0:9080...")
    server = await websockets.serve(gemini_session_handler, "0.0.0.0", 9080)
    await server.wait_closed()  # ✅ Keep the server running

if __name__ == "__main__":
    asyncio.run(main())



#MAIN APPLICATION BACKEND SCRIPT