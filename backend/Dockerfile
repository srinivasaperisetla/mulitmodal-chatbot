# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container
COPY . .

# Install required dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the WebSocket server runs on
EXPOSE 9080

# Set the environment variable (Ensure .env is included in COPY)
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]
