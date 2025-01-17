# Gemini API WebSocket Application with MultiModal Capabilites

This application provides a WebSocket server for interacting with the Gemini API and a Next.js frontend application for the client-side interface.

## Prerequisites

Before running the application, ensure the following are installed on your system:

- Python 3.8 or higher
- pip (Python package installer)
- Node.js (LTS version recommended)
- npm or yarn (for managing frontend dependencies)

## Steps to Run the Application

### 1. Backend Setup

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Install Dependencies**:
   Install the required Python packages by running:
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Run the Backend Server**:
   Start the WebSocket server by executing:
   ```bash
   python3 main.py
   ```

   The server will start running on `localhost:9080`.

### 2. Frontend Setup

1. **Open a New Terminal**:
   Open another terminal window or tab.

2. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

3. **Start the Next.js Application**:
   Run the following command to start the Next.js development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`.

## Environment Variables

The application uses environment variables to securely manage sensitive information such as API keys.

### Setting Up the `.env` File

1. Create a `.env` file in the `backend` directory.
2. Add the following content:
   ```plaintext
   GOOGLE_API_KEY=your-google-api-key-here
   ```
3. Replace `your-google-api-key-here` with your actual Google API key.

## Testing the Application

1. Open your browser and navigate to `http://localhost:3000` to access the frontend.
2. Ensure the backend server is running on `localhost:9080`.
3. Interact with the application to verify functionality.

## Troubleshooting

- **Backend Errors**:
  - Ensure all Python dependencies are installed using `pip3 install -r requirements.txt`.
  - Verify that the `.env` file is correctly set up with the Google API key.

- **Frontend Errors**:
  - Ensure Node.js and npm/yarn are installed.
  - Run `npm install` in the `frontend` directory if dependencies are missing.


