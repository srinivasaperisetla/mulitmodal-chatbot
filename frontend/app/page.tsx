"use client";
import { useState, useRef, useEffect } from "react";
import {
  FaMicrophone,
  FaPaperPlane,
  FaVideo,
  FaDesktop,
  FaStar,
} from "react-icons/fa";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSession } from "next-auth/react";
import LoginPage from "@/components/Login";
import { toast } from "sonner";
import SidebarSec from "@/components/Sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelBottom } from "lucide-react";
import { HiMiniBars3BottomLeft } from "react-icons/hi2";

export default function Home() {
  // const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
  // const genAI = new GoogleGenerativeAI(API_KEY);

  const { data: session, status, update } = useSession();
  const { state, toggleSidebar, isMobile } = useSidebar();

  const [isMicOn, setIsMicOn] = useState(false);
  const [isWebCamOn, setIsWebCamOn] = useState(false);
  const [isScreenShareOn, setIsScreenShareOn] = useState(false);

  const [inputMessage, setInputMessage] = useState("");

  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "ai" }[]
  >([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pcmData = useRef<number[]>([]);
  const currentFrameB64Ref = useRef<string | null>(null);

  const initializedRef = useRef(false);
  const audioInputContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const videoStreamRef = useRef<MediaStream | null>(null); // Separate ref for video
  const audioStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const webSocketRef = useRef<WebSocket | null>(null);

  const URL = "ws://localhost:9080";

  // const URL = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://backend:9080";

  if (status === "unauthenticated") {
    return <LoginPage />;
  }

  useEffect(() => {
    const interval = setInterval(() => update(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [update]);

  useEffect(() => {
    connect();

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        console.log("websocket connection closed due to cleanup");
      }
    };
  }, []);

  const connect = () => {
    console.log("connecting to websocket...", URL);

    const webSocket = new WebSocket(URL);
    webSocketRef.current = webSocket;

    webSocket.onclose = (event) => {
      console.log("WebSocket closed:", event);
      toast.error("WebSocket connection closed.");
    };

    webSocket.onerror = (event) => {
      console.log("WebSocket error:", event);
    };

    webSocket.onopen = (event) => {
      console.log("WebSocket open:", event);
      sendInitialSetupMessage();
    };

    webSocket.onmessage = recieveMessage;
  };

  const sendInitialSetupMessage = () => {
    console.log("Sending initial setup message...");

    const setupClientMessage = {
      setup: {
        generation_config: { responseModalities: ["AUDIO"] },
      },
    };

    if (
      webSocketRef.current &&
      webSocketRef.current.readyState === WebSocket.OPEN
    ) {
      webSocketRef.current.send(JSON.stringify(setupClientMessage));
      console.log("Setup message sent:", setupClientMessage);
    } else {
      console.log("Cannot send message The websocket is not open");
    }
  };

  const recieveMessage = (event: any) => {
    // console.log('received a message', event.data)
    const messageData = JSON.parse(event.data);
    // console.log("Parsed message data:", messageData);
    const response = new Response(messageData);

    if (response.text) {
      console.log("text");
      displayMessage({ text: response.text, sender: "ai" });
    }

    if (response.audioData) {
      // console.log("Received audio data:", response.audioData);
      injestAudioChunkToPlay(response.audioData);
    }
  };

  const displayMessage = (message: { text: string; sender: "user" | "ai" }) => {
    console.log("displaying message: ", message);
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const injestAudioChunkToPlay = async (base64AudioChunk: any) => {
    try {
      if (!initializedRef.current) {
        await initializeAudioContext();
      }

      const audioContext = audioInputContextRef.current;
      if (!audioContext) {
        throw new Error("AudioContext is not initialized.");
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const arrayBuffer = base64ToArrayBuffer(base64AudioChunk);
      const float32Data = convertPCM16LEToFloat32(arrayBuffer);

      const workletNode = workletNodeRef.current;

      if (workletNode) {
        workletNode.port.postMessage(float32Data);
      } else {
        console.error("WorkletNode is not initialized.");
      }
    } catch (err) {
      console.error("Error processing audio chunk:", err);
    }
  };

  const initializeAudioContext = async () => {
    if (!("AudioContext" in window)) {
      throw new Error("AudioContext is not supported in this browser.");
    }

    if (initializedRef.current) return;

    try {
      const audioContext = new AudioContext({
        sampleRate: 24000,
      });

      await audioContext.audioWorklet.addModule("/audio-processor.js"); // Ensure this file exists in the public directory
      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      workletNode.connect(audioContext.destination);

      audioInputContextRef.current = audioContext;
      workletNodeRef.current = workletNode;
      initializedRef.current = true;

      console.log("AudioContext and AudioWorkletNode initialized.");
    } catch (err) {
      console.log("Error initializing AudioContext:", err);
    }
  };

  const base64ToArrayBuffer = (base64: any): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  };

  const convertPCM16LEToFloat32 = (pcmData: ArrayBuffer): Float32Array => {
    const inputArray = new Int16Array(pcmData);
    const float32Array = new Float32Array(inputArray.length);
    for (let i = 0; i < inputArray.length; i++) {
      float32Array[i] = inputArray[i] / 32768;
    }

    return float32Array;
  };

  const handleMicToggle = () => {
    setIsMicOn((prevState) => {
      if (!prevState) {
        startAudioInput();
      } else if (prevState) {
        stopAudioInput();
      }
      return !prevState;
    });
  };

  const handleWebCamToggle = () => {
    setIsWebCamOn((prevState) => {
      if (!prevState) {
        startWebCam();
        stopScreenShare();
        setIsScreenShareOn(false);
      } else if (prevState) {
        stopWebCam();
      }
      return !prevState;
    });
  };

  const handleScreenShareToggle = () => {
    if (isScreenShareOn) {
      stopScreenShare();
      setIsScreenShareOn(false);
    } else {
      stopWebCam();
      setIsWebCamOn(false);
      startScreenShare();
      setIsScreenShareOn(true);
    }
  };

  const startScreenShare = async () => {
    try {
      if (screenShareStreamRef.current) {
        console.log("Screen share already active.");
        return;
      }

      const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenShareStreamRef.current = screenShareStream;

      if (videoRef.current) {
        videoRef.current.srcObject = screenShareStream;
        videoRef.current.play(); // Ensure the video starts playing
      }

      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }

      videoIntervalRef.current = setInterval(() => {
        captureImage();
      }, 1000);

      console.log("Screen share has started");
    } catch (err) {
      console.error("Error accessing the screen: ", err);
    }
  };

  const stopScreenShare = () => {
    if (screenShareStreamRef.current) {
      screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
      console.log(videoIntervalRef);
    }

    console.log("Screen Share stopped.");
  };

  const startWebCam = async () => {
    try {
      const constraints = {
        video: {
          width: { max: 640 },
          height: { max: 480 },
        },
      };

      const videoStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      videoStreamRef.current = videoStream;

      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }

      // console.log(videoIntervalRef.current)

      if (videoIntervalRef.current) {
        clearInterval(videoIntervalRef.current);
      }

      videoIntervalRef.current = setInterval(() => {
        // console.log("Automatically capturing image...");
        captureImage();
      }, 1000);

      console.log("webcam has started");
    } catch (err) {
      console.log("error accessing webcam:", err);
    }
  };

  const stopWebCam = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
      console.log(videoIntervalRef);
    }

    console.log("Webcam stopped.");
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg").split(",")[1].trim();
        // console.log("Captured Image (Base64):", imageData);
        currentFrameB64Ref.current = imageData;
      }
    }
  };

  const startAudioInput = async () => {
    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/audio-processor.js");

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      const source = audioContext.createMediaStreamSource(audioStream);
      const processor = new AudioWorkletNode(audioContext, "pcm-processor");
      processorRef.current = processor;

      processor.port.onmessage = (event) => {
        const pcmDataChunk = event.data as Int16Array;
        pcmData.current.push(...Array.from(pcmDataChunk));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }

      audioIntervalRef.current = setInterval(() => {
        recordChunk();
      }, 1000);

      console.log("Audio Input Started");
    } catch (err) {
      console.error("Error starting audio input:", err);
    }
  };

  const stopAudioInput = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    console.log("Audio Input Stopped");
  };

  const recordChunk = () => {
    console.log("Recording Chunk...");

    if (!pcmData.current.length) {
      console.log("No PCM data to record.");
      return;
    }

    const buffer = new ArrayBuffer(pcmData.current.length * 2); // 2 bytes per 16-bit integer
    const view = new DataView(buffer);

    pcmData.current.forEach((value, index) => {
      view.setInt16(index * 2, value, true); // Write PCM data as 16-bit integers
    });

    const uint8Array = new Uint8Array(buffer);
    // const binaryString = String.fromCharCode(...uint8Array);
    const binaryString = Array.from(uint8Array, (byte) =>
      String.fromCharCode(byte)
    ).join("");
    const base64 = btoa(binaryString);

    sendVoiceMessage(base64);

    pcmData.current = [];
  };

  const sendVoiceMessage = (b64PCM: string) => {
    if (
      !webSocketRef.current ||
      webSocketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.log("WebSocket is not initialized or not open.");
      return;
    }

    const payload = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm",
            data: b64PCM,
          },
          {
            mime_type: "image/jpeg",
            data: currentFrameB64Ref.current || "",
          },
        ],
      },
    };

    webSocketRef.current.send(JSON.stringify(payload));
    console.log("Sent:", payload);
  };

  interface ResponseData {
    text?: any;
    audio?: any; // Replace `any` with a more specific type if available
  }

  class Response {
    text: any | null;
    audioData: any | null;
    endOfTurn: any | null;

    constructor(data: ResponseData) {
      this.text = null;
      this.audioData = null;
      this.endOfTurn = null;

      if (data.text) {
        this.text = data.text;
      }

      if (data.audio) {
        this.audioData = data.audio;
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: inputMessage, sender: "user" },
    ]);

    // if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
    //   console.log("WebSocket is not initialized or not open.");
    //   return;
    // }

    // const payload = {
    //   realtime_input: {
    //     media_chunks: [
    //       {
    //         mime_type: "text",
    //         data: inputMessage
    //       }
    //     ]
    //   }
    // }

    // webSocketRef.current.send(JSON.stringify(payload));

    const response = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputMessage }),
    });

    const data = await response.json();

    displayMessage({ text: data.text, sender: "ai" });

    setInputMessage(""); // Clear input field after sending
  };

  return (
    <div className="flex flex-1 w-full h-svh ">
      <SidebarSec />

      <div className="w-full h-full flex-1 flex flex-col pb-5 bg-[#252424]">
        {!isMobile && (
          <div className=" sticky text-white bg-transparent h-[4em] w-full flex items-center justify-between px-10">
            {state === "collapsed" && (
              <div
                onClick={toggleSidebar}
                className="flex items-center justify-center cursor-pointer bg-transparent rounded-sm h-8 w-8"
              >
                <PanelBottom className="text-white text-[30px] size-full rotate-90" />
              </div>
            )}
            <p className="text-[17px]">HiAgents Chatbot</p>
          </div>
        )}``

        {isMobile && (
          <div className=" sticky text-white bg-transparent h-[4em] w-full flex items-center justify-between px-5">
            <button
              className="p-1 rounded-md border border-zinc-200 hover:bg-zinc-700"
              onClick={toggleSidebar}
            >
              <HiMiniBars3BottomLeft className="text-white" />
            </button>
            <p className="text-[12px] sm:text-[18px]">HiAgents Chatbot</p>
          </div>
        )}

        <div id="chatLog" className="p-4 text-lg h-3/4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } m-4 gap-3`}
            >
              {msg.sender === "ai" ? (
                <div className="p-2 h-max rounded-full border border-zinc-700">
                  <FaStar size={20} />
                </div>
              ) : null}
              <div
                className={`p-3 px-4 max-w-3/4 w-fit text-sm rounded-3xl ${
                  msg.sender === "user"
                    ? "bg-blue-950 text-white text-end"
                    : "bg-gray-800 text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {(isWebCamOn || isScreenShareOn) && (
            <div className="border-2 rounded-lg absolute bottom-4 right-4">
              <video
                ref={videoRef}
                className="w-60 h-auto rounded-md"
                autoPlay
              ></video>
            </div>
          )}

          <div>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
        </div>

        <div className=" text-lg rounded-2xl p-4 pb-2 px-6 w-[90%] sm:w-[70%] lg:w-[50%] mx-auto bg-zinc-900 ">
          <input
            type="text"
            placeholder="Message HealthiAI..."
            className="flex-grow bg-transparent text-white placeholder-gray-500 outline-none w-full mb-4"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />

          <div className="flex items-center justify-between text-gray-400 w-full">
            {/* Left Side - Microphone, Webcam, Screen Share */}
            <div className="flex items-center gap-x-2">
              {/* Microphone */}
              <button
                className={
                  isMicOn
                    ? "p-3 rounded-full border bg-zinc-700"
                    : "p-3 rounded-full border border-zinc-800 hover:bg-zinc-700"
                }
                onClick={handleMicToggle}
              >
                <FaMicrophone size={16} />
              </button>

              {/* Webcam */}
              <button
                className={
                  isWebCamOn
                    ? "p-3 rounded-full border bg-zinc-700"
                    : "p-3 rounded-full border border-zinc-800 hover:bg-zinc-700"
                }
                onClick={handleWebCamToggle}
              >
                <FaVideo size={16} />
              </button>

              {/* Screen Share */}
              <button
                className={
                  isScreenShareOn
                    ? "p-3 rounded-full border bg-zinc-700"
                    : "p-3 rounded-full border border-zinc-800 hover:bg-zinc-700"
                }
                onClick={handleScreenShareToggle}
              >
                <FaDesktop size={16} />
              </button>
            </div>

            {/* Right Side - Send Button */}
            <button
              className="p-4 bg-blue-500 rounded-full text-white text-sm rounded- hover:bg-blue-600"
              onClick={handleSendMessage}
            >
              <FaPaperPlane size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
