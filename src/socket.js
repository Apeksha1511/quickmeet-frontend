import { io } from "socket.io-client";

// ONE socket for the entire app — shared by Room, Video, and Chat
const socket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:5000");

export default socket;