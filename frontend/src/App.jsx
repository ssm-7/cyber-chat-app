import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Send, Settings, Circle, Hash } from 'lucide-react';
import io from 'socket.io-client';
import * as THREE from 'three';

// Connected to Port 5001 to sync cleanly with our updated backend service
const socket = io.connect('http://localhost:5001');

// ==========================================
// 3D WAVE ENGINE
// ==========================================
function WavePoints() {
  const pointsRef = useRef();

  const { positions, count } = useMemo(() => {
    const separation = 1.2;
    const countX = 40;
    const countY = 40;
    const numPoints = countX * countY;
    const posArray = new Float32Array(numPoints * 3);

    let i = 0;
    for (let x = 0; x < countX; x++) {
      for (let y = 0; y < countY; y++) {
        posArray[i] = (x - countX / 2) * separation;
        posArray[i + 1] = 0;
        posArray[i + 2] = (y - countY / 2) * separation;
        i += 3;
      }
    }
    return { positions: posArray, count: numPoints };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!pointsRef.current || !pointsRef.current.geometry) return;
    const posAttr = pointsRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const newY = Math.sin(dist * 0.3 - time * 2) * 0.6 + Math.cos(x * 0.2 + time) * 0.3;
      posAttr.setY(i, newY);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00d2ff"
        size={0.18}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 bg-[#060314] -z-10 overflow-hidden w-full h-full">
      <Canvas camera={{ position: [0, 8, 22], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <WavePoints />
      </Canvas>
      <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-10%] right-[20%] w-[400px] h-[400px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}

// ==========================================
// MAIN APPLICATION DASHBOARD DECK
// ==========================================
const CONTACTS = [
  { id: 1, name: 'Alex Ramirez', role: 'Lead Architect', online: true },
  { id: 2, name: 'Zoe Chen', role: 'UI Engineer', online: true },
  { id: 3, name: 'Maya Patel', role: 'Product Manager', online: true },
  { id: 4, name: 'Jinia Sarinna', role: 'Data Scientist', online: false },
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  // Tab states for dynamic routing layout control
  const [activeChat, setActiveChat] = useState('global-synapse-mesh');
  const [activeNav, setActiveNav] = useState('chat');

  // Sync WebSocket connection subscription arrays when user swaps channels
  useEffect(() => {
    socket.emit('join_room', activeChat);
  }, [activeChat]);

  // Handle stream broadcast delivery from the socket server node
  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const payload = {
      id: Date.now(),
      room: activeChat,
      sender: socket.id ? socket.id.substring(0, 5) : 'Guest',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('send_message', payload);
    setInput('');
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center font-sans p-4 select-none overflow-hidden">
      <BackgroundGrid />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl h-[620px] rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-[0_0_50px_rgba(255,0,128,0.15)] flex overflow-hidden z-10"
      >
        {/* Leftmost Navigation Icon Strip */}
        <div className="w-16 border-r border-white/5 bg-black/30 flex flex-col items-center py-6 justify-between text-slate-400">
          <div className="flex flex-col gap-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(255,0,128,0.4)]">Ω</div>
            
            <button 
              type="button" 
              onClick={() => setActiveNav('chat')}
              className={`p-2 rounded-lg transition-colors ${activeNav === 'chat' ? 'text-cyan-400 bg-white/5' : 'hover:text-cyan-400'}`}
            >
              <MessageSquare size={20} />
            </button>
            
            <button 
              type="button" 
              onClick={() => setActiveNav('users')}
              className={`p-2 rounded-lg transition-colors ${activeNav === 'users' ? 'text-cyan-400 bg-white/5' : 'hover:text-cyan-400'}`}
            >
              <Users size={20} />
            </button>
          </div>
          <button type="button" className="hover:text-pink-400 p-2"><Settings size={20} /></button>
        </div>

        {/* Contacts Sidebar Panel Navigation layer */}
        <div className="w-64 border-r border-white/5 bg-slate-900/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-white text-sm font-semibold tracking-wider uppercase opacity-80">
              {activeNav === 'chat' ? 'Channels & DMs' : 'All Users'}
            </h2>
          </div>
          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            
            {/* Global Main Space Target Node */}
            {activeNav === 'chat' && (
              <div 
                onClick={() => setActiveChat('global-synapse-mesh')}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${
                  activeChat === 'global-synapse-mesh' 
                    ? 'bg-pink-500/10 border border-pink-500/30 text-white shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Hash size={16} className="text-pink-400" />
                <span className="text-xs font-medium">global-synapse-mesh</span>
              </div>
            )}

            {/* Target Channel Mappings */}
            {CONTACTS.map((user) => {
              const isSelected = activeChat === user.name;
              return (
                <motion.div 
                  whileHover={{ x: 4 }}
                  key={user.id} 
                  onClick={() => setActiveChat(user.name)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300">
                      {user.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-medium">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.role}</div>
                    </div>
                  </div>
                  <Circle size={8} className={user.online ? "fill-green-400 text-green-400" : "text-slate-600"} />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Messaging Interface Frame Workspace */}
        <div className="flex-1 flex flex-col bg-slate-950/10">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/10">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-pink-400" />
              <span className="text-white text-xs font-semibold tracking-wide">{activeChat}</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> 
              Live Node Matrix Secured
            </div>
          </div>

          {/* Active Encapsulated Messages Stream Container */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col justify-end">
            <AnimatePresence initial={false}>
              {messages
                .filter((msg) => msg.room === activeChat)
                .map((msg) => {
                  const isMe = msg.sender === (socket.id ? socket.id.substring(0, 5) : 'Guest');
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      key={msg.id}
                      className={`max-w-[80%] flex flex-col gap-1 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="flex items-baseline gap-2 px-1">
                        <span className="text-[10px] text-pink-400 font-medium">{isMe ? 'You' : `Node_${msg.sender}`}</span>
                        <span className="text-[9px] text-slate-500">{msg.time}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs border ${
                        isMe 
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500/30 text-pink-50 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                        : 'bg-white/5 border-white/10 text-slate-200 backdrop-blur-md'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>

          {/* Core Input Delivery Controls */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Send packet to ${activeChat}...`} 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500 transition-all"
            />
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
              <Send size={14} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}