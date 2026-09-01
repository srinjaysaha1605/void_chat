/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ChatMessage, UserProfile } from './types';
import { generateId } from './utils';
import { 
  Terminal, 
  Send, 
  User, 
  Tv, 
  Palette, 
  HelpCircle, 
  LogOut, 
  Copy, 
  Check, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Globe, 
  Zap, 
  ArrowDown, 
  Sparkles,
  Info,
  Keyboard,
  Volume2,
  VolumeX,
  X,
  Lock,
  Unlock,
  Plus,
  Key,
  Layers,
  RefreshCw
} from 'lucide-react';

// Integrated Supabase credentials
const supabaseUrl = 'https://ouhiisuzkcgtiwhpnbvz.supabase.co';
const supabaseKey = 'sb_publishable_HnvBQa9opn-v5YAJR8c1-Q_zwbKFEXv';
const supabase = createClient(supabaseUrl, supabaseKey);

// Shared global AudioContext for reliable playback without browser limit errors
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
};

// Global listener to unlock browser Web Audio autoplay policy on first click/keypress
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().then(() => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }).catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}

// Retro mechanical click sound generator using Web Audio API
const playTerminalClick = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    
    // Main tone oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    // Frequency blip for mechanical click
    const baseFreq = 600 + Math.random() * 250;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);
    
    // Audible gain (0.15 volume)
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.025);
  } catch (e) {
    // Ignore audio context errors
  }
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  enabled?: boolean;
  soundEnabled?: boolean;
  onCharacterTyped?: () => void;
  onComplete?: () => void;
}

function TypewriterText({
  text,
  speed = 18,
  enabled = true,
  soundEnabled = true,
  onCharacterTyped,
  onComplete
}: TypewriterTextProps) {
  const completedRef = useRef(!enabled || text.length === 0);
  const [displayedLength, setDisplayedLength] = useState(completedRef.current ? text.length : 0);
  const [isTyping, setIsTyping] = useState(!completedRef.current);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    // If already finished typing this text, keep full text displayed and do not restart
    if (completedRef.current) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }

    if (!enabled || text.length === 0) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      completedRef.current = true;
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayedLength(current);

      if (soundRef.current && current % 2 === 0) {
        playTerminalClick();
      }

      if (onCharacterTyped) {
        onCharacterTyped();
      }

      if (current >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        completedRef.current = true;
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, enabled, speed]);

  const finishImmediately = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTyping) {
      completedRef.current = true;
      setDisplayedLength(text.length);
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <span onClick={finishImmediately} title={isTyping ? "Click to complete typing" : undefined}>
      {text.slice(0, displayedLength)}
      {isTyping && <span className="typewriter-cursor" />}
    </span>
  );
}

const SQL_SETUP = `
-- 1. Create the messages table
create table messages (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default now(),
  handle text not null,
  rank text not null,
  content text not null,
  room_id text not null default 'void-room'
);

-- 2. Enable Realtime Change Data Capture for this table
alter publication supabase_realtime add table messages;
`.trim();

const RANDOM_NAMES = [
  'CyberKnight', 'PixelRunner', 'ByteMaster', 'NovaEcho', 
  'VortexGhost', 'SolarPioneer', 'EchoChaser', 'NullPointer'
];

const PRESET_ROLES = ['Developer', 'Guest', 'Explorer', 'Gamer', 'Designer', 'Architect'];

interface ToastNotification {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [loginFields, setLoginFields] = useState({ name: '', title: 'EXPLORER' });
  const [networkStatus, setNetworkStatus] = useState<'OFFLINE' | 'CONNECTED'>('OFFLINE');
  const [hasSchemaError, setHasSchemaError] = useState(false);
  
  // Theme, CRT, Typewriter & Sound controls
  const [theme, setTheme] = useState<'matrix' | 'amber' | 'cyan' | 'cmd'>('matrix');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [typewriterEnabled, setTypewriterEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Secret console state
  const [isGlitched, setIsGlitched] = useState(false);
  const [showSecretConsole, setShowSecretConsole] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretLogs, setSecretLogs] = useState<string[]>([
    'C:\\> CLASSIFIED OVERRIDE CONSOLE v2.0',
    'C:\\> Press CTRL + SHIFT + K to toggle access.',
    'C:\\> Enter access phrase...'
  ]);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [sessionJoinTime, setSessionJoinTime] = useState<number | null>(null);

  // Room State: Public vs Private Vaults
  const [activeRoomId, setActiveRoomId] = useState<string>('void-room');
  const [roomType, setRoomType] = useState<'public' | 'create_private' | 'join_private'>('public');
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [generatedVaultCode, setGeneratedVaultCode] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [modalRoomInput, setModalRoomInput] = useState('');

  const generateVaultCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newCode = `VAULT-${code}`;
    setGeneratedVaultCode(newCode);
    return newCode;
  };

  useEffect(() => {
    if (roomType === 'create_private' && !generatedVaultCode) {
      generateVaultCode();
    }
  }, [roomType]);

  // Global shortcut listener for Ctrl + Shift + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        e.preventDefault();
        setShowSecretConsole(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence animation
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    if (scrollRef.current && !isScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isScrolledUp]);

  // Handle scroll event to show "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsScrolledUp(!isBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsScrolledUp(false);
    }
  };

  const mapDbToMessage = (payload: any): ChatMessage => ({
    id: payload.id?.toString() || generateId(),
    sender: { name: payload.handle, title: payload.rank },
    text: payload.content,
    timestamp: payload.created_at ? new Date(payload.created_at).getTime() : Date.now(),
    isSystem: payload.handle === 'SYSTEM'
  });

  // Detect missing table/schema errors
  const isTableError = (error: any) => {
    if (!error) return false;
    const msg = error.message?.toLowerCase() || '';
    const code = error.code || '';
    return (
      msg.includes('messages') || 
      msg.includes('schema cache') || 
      msg.includes('relation "public.messages" does not exist') ||
      code === 'PGRST116' || 
      code === '42P01'
    );
  };

  // Sync latest messages from database as fallback sync (only post-join messages for active room)
  const syncLatestMessages = async () => {
    if (!user || hasSchemaError || !sessionJoinTime) return;
    const joinIso = new Date(sessionJoinTime).toISOString();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', activeRoomId)
      .gte('created_at', joinIso)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      if (isTableError(error)) setHasSchemaError(true);
      return;
    }

    if (data && data.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = data
          .map(mapDbToMessage)
          .filter(m => m.timestamp >= sessionJoinTime && !existingIds.has(m.id));

        if (newMsgs.length === 0) return prev;
        return [...prev, ...newMsgs];
      });
    }
  };

  // Realtime subscription (Broadcast + Postgres CDC + Fallback Polling) per active room
  useEffect(() => {
    if (!user || hasSchemaError || !sessionJoinTime) return;

    const channel = supabase
      .channel(`realtime-room-${activeRoomId}`, {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.new && (payload.new.room_id === activeRoomId)) {
            const newMessage = mapDbToMessage(payload.new);
            if (newMessage.timestamp >= sessionJoinTime) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
            }
          }
        }
      )
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload && (payload.roomId === activeRoomId || !payload.roomId)) {
          const newMessage = payload as ChatMessage;
          if (newMessage.timestamp >= sessionJoinTime) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setNetworkStatus('CONNECTED');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setNetworkStatus('OFFLINE');
        }
      });

    channelRef.current = channel;

    // Periodic sync polling (every 2.5 seconds) ensuring 100% data sync across clients
    const syncInterval = setInterval(() => {
      syncLatestMessages();
    }, 2500);

    return () => {
      clearInterval(syncInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, hasSchemaError, sessionJoinTime, activeRoomId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginFields.name.trim()) return;

    let targetRoom = 'void-room';
    if (roomType === 'create_private') {
      targetRoom = generatedVaultCode || generateVaultCode();
    } else if (roomType === 'join_private') {
      let raw = privateCodeInput.trim().toUpperCase();
      if (!raw) {
        addToast('Please enter a vault room code.', 'warning');
        return;
      }
      if (!raw.startsWith('VAULT-')) {
        raw = `VAULT-${raw}`;
      }
      targetRoom = raw;
    }

    setIsJoining(true);
    
    const now = Date.now();
    const newUser = { 
      name: loginFields.name.trim(), 
      title: loginFields.title.trim() || 'EXPLORER' 
    };

    setUser(newUser);
    setActiveRoomId(targetRoom);
    setSessionJoinTime(now);
    setIsJoining(false);
    
    const isPrivate = targetRoom !== 'void-room';
    const welcomeMsg: ChatMessage = {
      id: generateId(),
      sender: { name: 'SYSTEM', title: 'NETWORK' },
      text: isPrivate
        ? `Encrypted Vault Connected [${targetRoom}]. Share code with team members.`
        : `Connection established. Welcome to VOIDCHAT Global Room, ${newUser.name}!`,
      timestamp: now,
      isSystem: true
    };
    setMessages([welcomeMsg]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const textContent = inputValue.trim();
    setInputValue('');

    // Handle slash commands
    if (textContent.startsWith('/')) {
      handleSlashCommand(textContent);
      return;
    }

    if (hasSchemaError) {
      // Local fallback mode when database table is missing
      const fallbackMsg: ChatMessage = {
        id: generateId(),
        sender: { name: user.name, title: user.title },
        text: textContent,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { ...fallbackMsg, roomId: activeRoomId }
        });
      }
      return;
    }

    // Insert directly into Supabase DB table
    const { data, error } = await supabase
      .from('messages')
      .insert({
        handle: user.name,
        rank: user.title,
        content: textContent,
        room_id: activeRoomId
      })
      .select('*');

    if (error) {
      console.error("Message send error", error);
      if (isTableError(error)) {
        setHasSchemaError(true);
        const fallbackMsg: ChatMessage = {
          id: generateId(),
          sender: { name: user.name, title: user.title },
          text: textContent,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, fallbackMsg]);
      } else {
        addToast(`Failed to send message: ${error.message || 'Network issue'}`, 'warning');
      }
    } else if (data && data[0]) {
      const realMsg = mapDbToMessage(data[0]);
      // Add message only after it is saved in the database table
      setMessages(prev => {
        if (prev.some(m => m.id === realMsg.id)) return prev;
        return [...prev, realMsg];
      });

      // Broadcast to other users over WebSocket channel
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: { ...realMsg, roomId: activeRoomId }
        });
      }
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(activeRoomId);
    addToast(`Room code copied: ${activeRoomId}`, 'success');
  };

  const switchRoom = (newRoomId: string) => {
    const raw = newRoomId.trim().toUpperCase();
    if (!raw) return;
    const finalRoom = (raw === 'PUBLIC' || raw === 'VOID-ROOM') 
      ? 'void-room' 
      : (raw.startsWith('VAULT-') ? raw : `VAULT-${raw}`);

    if (finalRoom === activeRoomId) {
      addToast(`Already connected to ${finalRoom}.`);
      setShowRoomModal(false);
      return;
    }

    const now = Date.now();
    setActiveRoomId(finalRoom);
    setSessionJoinTime(now);
    setMessages([]);

    const isPrivate = finalRoom !== 'void-room';
    const sysMsg: ChatMessage = {
      id: generateId(),
      sender: { name: 'SYSTEM', title: 'NETWORK' },
      text: isPrivate 
        ? `Switched to Encrypted Vault [${finalRoom}].`
        : `Switched to Global Public Room [VOID-ROOM].`,
      timestamp: now,
      isSystem: true
    };
    setMessages([sysMsg]);
    setShowRoomModal(false);
    addToast(`Switched to room ${finalRoom}`, 'success');
  };

  const handleSlashCommand = (cmd: string) => {
    const command = cmd.toLowerCase().trim();
    if (command === '/clear') {
      setMessages([]);
      addToast('Terminal chat history cleared locally.');
    } else if (command === '/help') {
      setShowHelp(true);
    } else if (command === '/theme') {
      cycleTheme();
    } else if (command === '/typewriter') {
      const next = !typewriterEnabled;
      setTypewriterEnabled(next);
      addToast(`Typewriter animation ${next ? 'ENABLED' : 'DISABLED'}.`);
    } else if (command === '/sound') {
      const next = !soundEnabled;
      setSoundEnabled(next);
      if (next) {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
        setTimeout(() => playTerminalClick(), 50);
      }
      addToast(`Terminal click sound effects ${next ? 'ENABLED' : 'DISABLED'}.`);
    } else if (command === '/time') {
      addToast(`System time: ${new Date().toLocaleString()}`);
    } else if (command === '/room' || command === '/vault') {
      setModalRoomInput('');
      setShowRoomModal(true);
    } else if (command === '/code') {
      copyRoomCode();
    } else if (command.startsWith('/switch ')) {
      const target = cmd.substring(8).trim();
      if (target) switchRoom(target);
    } else if (command === 'going dark' || command === '/going dark' || command === 'goingdark') {
      setTheme('cmd');
      addToast('Stealth CMD Dark Mode Activated!', 'success');
    } else if (command === 'going light' || command === '/going light') {
      setTheme('matrix');
      addToast('Standard Matrix Theme Restored.');
    } else if (command === 'glitch' || command === '/glitch' || command === 'overclock') {
      setIsGlitched(true);
      playTerminalClick();
      addToast('Cyberpunk glitch distortion triggered!', 'warning');
      setTimeout(() => {
        setIsGlitched(false);
      }, 3500);
    } else {
      addToast(`Unknown command "${cmd}". Type /help for assistance.`, 'warning');
    }
  };

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = secretInput.trim();
    if (!trimmed) return;

    const cmd = trimmed.toLowerCase();
    const updatedLogs = [...secretLogs, `C:\\> ${trimmed}`];

    if (cmd === 'going dark' || cmd === 'goingdark' || cmd === '/going dark') {
      setTheme('cmd');
      updatedLogs.push('[+] OVERRIDE ACCEPTED: PROTOCOL "GOING DARK" ACTIVATED.');
      updatedLogs.push('[+] STEALTH MONOCHROME CMD MODE ENGAGED.');
      addToast('Stealth CMD Dark Mode Activated!', 'success');
    } else if (cmd === 'going light' || cmd === 'going matrix' || cmd === 'matrix') {
      setTheme('matrix');
      updatedLogs.push('[+] RESTORING STANDARD MATRIX PHOSPHOR THEME.');
      addToast('Standard Matrix Theme Restored.');
    } else if (cmd === 'glitch' || cmd === '/glitch' || cmd === 'overclock') {
      setIsGlitched(true);
      playTerminalClick();
      updatedLogs.push('[!] CRITICAL: NEURAL HARDWARE OVERCLOCK GLITCH ENGAGED.');
      addToast('Cyberpunk glitch distortion triggered!', 'warning');
      setTimeout(() => {
        setIsGlitched(false);
      }, 3500);
    } else if (cmd === 'clear') {
      setSecretLogs(['C:\\> CLASSIFIED OVERRIDE CONSOLE v2.0']);
      setSecretInput('');
      return;
    } else if (cmd === 'exit' || cmd === 'quit') {
      setShowSecretConsole(false);
      setSecretInput('');
      return;
    } else if (cmd === 'help') {
      updatedLogs.push('Valid Secret Commands:');
      updatedLogs.push('  Going Dark  - Activate Stealth Monochrome CMD Mode');
      updatedLogs.push('  Going Light - Restore Standard Matrix Theme');
      updatedLogs.push('  glitch      - Trigger 3.5s cyberpunk CRT glitch distortion');
      updatedLogs.push('  clear       - Clear console logs');
      updatedLogs.push('  exit        - Close secret terminal');
    } else {
      updatedLogs.push(`[-] UNKNOWN COMMAND: "${trimmed}". Access denied.`);
    }

    setSecretLogs(updatedLogs);
    setSecretInput('');
  };

  const cycleTheme = () => {
    let nextTheme: 'matrix' | 'amber' | 'cyan' | 'cmd' = 'matrix';
    if (theme === 'matrix') nextTheme = 'amber';
    else if (theme === 'amber') nextTheme = 'cyan';
    else if (theme === 'cyan') nextTheme = 'cmd';
    else nextTheme = 'matrix';
    
    setTheme(nextTheme);
    addToast(`Color theme set to ${nextTheme.toUpperCase()}`);
  };

  const handleRandomName = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setLoginFields(prev => ({ ...prev, name: randomName }));
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SQL_SETUP);
    setCopiedSql(true);
    addToast('SQL setup script copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`terminal-window ${isGlitched ? 'glitch-active' : ''}`} data-theme={theme}>
      {isGlitched && <div className="glitch-overlay-effect" />}
      {/* TOP POPUP TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="toast-item">
              <div className="toast-message">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>{toast.message}</span>
              </div>
              <button 
                className="toast-close" 
                onClick={() => removeToast(toast.id)} 
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Optional CRT Shader layers */}
      {crtEnabled && <div className="scanlines"></div>}
      {crtEnabled && <div className="crt-glow"></div>}

      {/* WINDOW TITLE BAR */}
      <div className="terminal-top-bar">
        <div className="window-controls">
          <span className="window-dot close"></span>
          <span className="window-dot minimize"></span>
          <span className="window-dot maximize"></span>
          <span className="terminal-title-text ml-2">
            <Terminal size={14} /> VOIDCHAT TERMINAL v2.2
          </span>
        </div>

        <div className="terminal-actions">
          <span style={{ opacity: 0.6, fontSize: '0.75rem', marginRight: '10px' }}>
            {currentTime}
          </span>
          
          <button 
            className="icon-btn" 
            onClick={cycleTheme}
            title="Switch Color Theme"
          >
            <Palette size={13} />
            <span className="hidden-mobile">{theme.toUpperCase()}</span>
          </button>

          <button 
            className="icon-btn" 
            onClick={() => {
              const next = !typewriterEnabled;
              setTypewriterEnabled(next);
              addToast(`Typewriter animation ${next ? 'ENABLED' : 'DISABLED'}.`);
            }}
            title="Toggle Typewriter Effect"
          >
            <Keyboard size={13} />
            <span className="hidden-mobile">TYPEWRITER: {typewriterEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button 
            className="icon-btn" 
            onClick={() => {
              const nextState = !soundEnabled;
              setSoundEnabled(nextState);
              if (nextState) {
                const ctx = getAudioContext();
                if (ctx && ctx.state === 'suspended') {
                  ctx.resume();
                }
                setTimeout(() => playTerminalClick(), 50);
              }
              addToast(`Terminal click sound effects ${nextState ? 'ENABLED' : 'DISABLED'}.`);
            }}
            title="Toggle Typing Click Sound"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden-mobile">SOUND: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button 
            className="icon-btn" 
            onClick={() => {
              const next = !crtEnabled;
              setCrtEnabled(next);
              addToast(`CRT scanline shader ${next ? 'ENABLED' : 'DISABLED'}.`);
            }}
            title="Toggle Scanline Shader"
          >
            <Tv size={13} />
            <span className="hidden-mobile">CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button 
            className="icon-btn" 
            onClick={() => setShowHelp(true)}
            title="Help & Commands"
          >
            <HelpCircle size={13} />
          </button>
        </div>
      </div>

      {/* BOOT SCREEN */}
      {isBooting && (
        <div className="boot-screen">
          <div className="boot-card">
            <div className="boot-text">
              <p>INITIALIZING VOIDCHAT TERMINAL...</p>
              <p>ESTABLISHING SECURE REALTIME CONNECTION...</p>
              <p>SYNCHRONIZING DATABASE ARCHIVES...</p>
              <p>SYSTEM READY.</p>
              <span className="cursor">_</span>
            </div>
          </div>
        </div>
      )}

      {/* SCHEMA ERROR SCREEN */}
      {!isBooting && hasSchemaError && (
        <div className="login-screen">
          <div className="login-card schema-card">
            <h2 style={{ color: '#ef4444', margin: '0 0 12px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={18} /> DATABASE SETUP REQUIRED
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#fca5a5', marginBottom: '16px', lineHeight: '1.5' }}>
              The <strong>messages</strong> table is missing from your database. Run the following SQL script in your Supabase SQL Editor to enable real-time messaging:
            </p>
            <pre className="sql-box">{SQL_SETUP}</pre>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={copySqlToClipboard}
                className="btn-primary" 
                style={{ flex: 1, background: '#3b82f6', color: '#fff' }}
              >
                {copiedSql ? <Check size={16} /> : <Copy size={16} />}
                {copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}
              </button>

              <button 
                onClick={() => window.location.reload()}
                className="btn-primary" 
                style={{ flex: 1, background: '#ef4444', color: '#fff' }}
              >
                <RotateCcw size={16} /> Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENTER IDENTITY / LOGIN SCREEN */}
      {!isBooting && !hasSchemaError && !user && (
        <div className="login-screen">
          <form className="login-card" onSubmit={handleJoin}>
            <div className="ascii-art">
              <pre>{`
  ██╗   ██╗ ██████╗ ██╗██████╗  ██████╗██╗  ██╗    ██████╗████████╗
  ██║   ██║██╔═══██╗██║██╔══██╗██╔════╝██║  ██║   ██╔════╝╚══██╔══╝
  ██║   ██║██║   ██║██║██║  ██║██║     ███████║   ██║        ██║   
  ╚██╗ ██╔╝██║   ██║██║██║  ██║██║     ██╔══██║   ██║        ██║   
   ╚████╔╝ ╚██████╔╝██║██████╔╝╚██████╗██║  ██║██╗╚██████╗   ██║   
    ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝ ╚═════╝   ╚═╝   
              `}</pre>
            </div>
            
            <div className="login-subheading">
              GLOBAL REALTIME CHATROOM
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label htmlFor="display-name">YOUR DISPLAY NAME</label>
                <button type="button" className="random-btn" onClick={handleRandomName}>
                  <Sparkles size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                  Random Name
                </button>
              </div>
              <input 
                id="display-name"
                autoFocus
                maxLength={20}
                placeholder="Enter your name or handle..."
                value={loginFields.name}
                onChange={e => setLoginFields({ ...loginFields, name: e.target.value })}
                disabled={isJoining}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label htmlFor="user-role">TITLE / ROLE (OPTIONAL)</label>
              </div>
              <input 
                id="user-role"
                maxLength={24}
                placeholder="e.g. Developer, Guest, Explorer"
                value={loginFields.title}
                onChange={e => setLoginFields({ ...loginFields, title: e.target.value })}
                disabled={isJoining}
                autoComplete="off"
              />
              <div className="pill-container">
                {PRESET_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`preset-pill ${loginFields.title.toUpperCase() === role.toUpperCase() ? 'active' : ''}`}
                    onClick={() => setLoginFields({ ...loginFields, title: role })}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <div className="input-label-row">
                <label>SELECT CHATROOM TYPE</label>
              </div>
              <div className="room-selector-tabs">
                <button
                  type="button"
                  className={`room-tab-btn ${roomType === 'public' ? 'active' : ''}`}
                  onClick={() => setRoomType('public')}
                >
                  <Globe size={16} />
                  <span>Public Room</span>
                </button>
                <button
                  type="button"
                  className={`room-tab-btn ${roomType === 'create_private' ? 'active' : ''}`}
                  onClick={() => {
                    setRoomType('create_private');
                    generateVaultCode();
                  }}
                >
                  <Lock size={16} />
                  <span>Create Vault</span>
                </button>
                <button
                  type="button"
                  className={`room-tab-btn ${roomType === 'join_private' ? 'active' : ''}`}
                  onClick={() => setRoomType('join_private')}
                >
                  <Key size={16} />
                  <span>Join Vault</span>
                </button>
              </div>

              {roomType === 'create_private' && (
                <div className="vault-code-box">
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--terminal-muted)', marginBottom: '2px' }}>SHAREABLE VAULT CODE</div>
                    <div className="vault-code-val">{generatedVaultCode}</div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={generateVaultCode}
                    title="Generate New Code"
                  >
                    <RefreshCw size={14} /> New
                  </button>
                </div>
              )}

              {roomType === 'join_private' && (
                <div style={{ marginTop: '10px' }}>
                  <input 
                    maxLength={16}
                    placeholder="Enter Vault Code (e.g. VAULT-8492XA)..."
                    value={privateCodeInput}
                    onChange={e => setPrivateCodeInput(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isJoining || !loginFields.name.trim()}>
              {isJoining ? 'Connecting to Chatroom...' : 'JOIN CHATROOM ↵'}
            </button>

            <div className="features-row">
              <span><ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Private Session</span>
              <span><Zap size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Instant Realtime</span>
              <span><Globe size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Global Room</span>
            </div>
          </form>
        </div>
      )}

      {/* MAIN CHAT SCREEN */}
      {!isBooting && !hasSchemaError && user && (
        <div className="chat-window">
          {/* SUBHEADER STATUS BAR */}
          <div className="chat-subheader">
            <div className="user-badge-group">
              <span className="user-tag">
                <User size={14} /> {user.name}
              </span>
              <span className="role-tag">{user.title}</span>

              {activeRoomId === 'void-room' ? (
                <span className="room-badge public" onClick={() => setShowRoomModal(true)} title="Click to change room">
                  <Globe size={12} /> PUBLIC ROOM
                </span>
              ) : (
                <span className="room-badge private" onClick={copyRoomCode} title="Click to copy room code">
                  <Lock size={12} /> {activeRoomId} <Copy size={11} />
                </span>
              )}
            </div>

            <div className="display-flex items-center gap-4">
              <span className={`status-indicator ${networkStatus.toLowerCase()}`}>
                <span className="status-dot"></span>
                {networkStatus === 'CONNECTED' ? 'ONLINE (REALTIME)' : 'DISCONNECTED'}
              </span>

              <button 
                className="icon-btn" 
                style={{ marginLeft: '8px' }}
                onClick={() => {
                  setModalRoomInput('');
                  setShowRoomModal(true);
                }}
                title="Switch Room / Vault"
              >
                <Layers size={13} /> Room
              </button>

              <button 
                className="icon-btn" 
                style={{ marginLeft: '8px' }}
                onClick={() => {
                  setUser(null);
                  setMessages([]);
                  setSessionJoinTime(null);
                }}
                title="Exit Chatroom"
              >
                <LogOut size={13} /> Exit
              </button>
            </div>
          </div>

          {/* MESSAGE LIST */}
          <div className="message-stream" ref={scrollRef} onScroll={handleScroll}>
            {messages.map((msg, index) => {
              const uniqueKey = msg.id ? `msg-${msg.id}-${index}` : `msg-idx-${index}-${msg.timestamp}`;
              if (msg.isSystem) {
                return (
                  <div key={uniqueKey} className="system-row">
                    <div className="system-banner">
                      <Info size={14} />
                      <span>
                        <TypewriterText 
                          text={msg.text} 
                          enabled={typewriterEnabled && !msg.isHistorical} 
                          soundEnabled={soundEnabled}
                          speed={12}
                        />
                      </span>
                    </div>
                  </div>
                );
              }

              const isSelf = msg.sender.name.toUpperCase() === user.name.toUpperCase();

              return (
                <div key={uniqueKey} className={`message-row ${isSelf ? 'self' : 'other'}`}>
                  <div className="msg-header">
                    <span className="msg-author">[{msg.sender.name}]</span>
                    {msg.sender.title && <span className="msg-role">({msg.sender.title})</span>}
                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="msg-bubble">
                    <TypewriterText 
                      text={msg.text} 
                      enabled={typewriterEnabled && !msg.isHistorical} 
                      soundEnabled={soundEnabled}
                      speed={16}
                      onCharacterTyped={() => {
                        if (scrollRef.current && !isScrolledUp) {
                          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* SCROLL DOWN BUTTON */}
          {isScrolledUp && (
            <button className="scroll-btn" onClick={scrollToBottom}>
              <ArrowDown size={14} /> New Messages
            </button>
          )}

          {/* QUICK COMMAND BAR */}
          <div className="command-bar">
            <span style={{ opacity: 0.6 }}>Shortcuts:</span>
            <button className="cmd-chip" onClick={() => handleSlashCommand('/help')}>/help</button>
            <button className="cmd-chip" onClick={() => handleSlashCommand('/clear')}>/clear</button>
            <button className="cmd-chip" onClick={() => handleSlashCommand('/typewriter')}>/typewriter</button>
            <button className="cmd-chip" onClick={() => handleSlashCommand('/sound')}>/sound</button>
            <button className="cmd-chip" onClick={() => cycleTheme()}>/theme ({theme})</button>
            <button className="cmd-chip" onClick={() => handleSlashCommand('/time')}>/time</button>
          </div>

          {/* CHAT INPUT BAR */}
          <form className="chat-input-container" onSubmit={handleSendMessage}>
            <span className="prompt-symbol">VOIDCHAT &gt;</span>
            <input 
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (soundEnabled && e.key.length === 1) {
                  playTerminalClick();
                }
              }}
              placeholder="Type your message here... (Press Enter to send)"
              autoComplete="off"
            />
            <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
              <Send size={14} /> Send
            </button>
          </form>

          {/* FOOTER */}
          <div className="terminal-footer-bar">
            <span>VOIDCHAT REALTIME NETWORK</span>
            <span>{messages.length} Messages Loaded</span>
            <span>{activeRoomId === 'void-room' ? 'Global Public Room' : `Private Vault: ${activeRoomId}`}</span>
          </div>
        </div>
      )}

      {/* ROOM SWITCHER MODAL */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="flex items-center gap-2">
                <Layers size={18} /> SWITCH CHATROOM / VAULT
              </span>
              <button className="icon-btn" onClick={() => setShowRoomModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--terminal-text)', margin: 0 }}>
                Currently in: <strong>{activeRoomId === 'void-room' ? 'Global Public Room' : `Private Vault (${activeRoomId})`}</strong>
              </p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '10px' }}
                  onClick={() => switchRoom('void-room')}
                >
                  <Globe size={14} /> Public Room
                </button>

                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '0.85rem', padding: '10px', background: '#0284c7', color: '#fff' }}
                  onClick={() => switchRoom(generateVaultCode())}
                >
                  <Plus size={14} /> Create Vault
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--panel-border-dim)', paddingTop: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--terminal-muted)', display: 'block', marginBottom: '6px' }}>
                  JOIN EXISTING VAULT BY CODE
                </label>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (modalRoomInput.trim()) {
                      switchRoom(modalRoomInput.trim());
                    }
                  }}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input 
                    placeholder="Enter code (e.g. VAULT-8492XA)..."
                    value={modalRoomInput}
                    onChange={e => setModalRoomInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 16px' }}>
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="flex items-center gap-2">
                <HelpCircle size={18} /> VOIDCHAT HELP & COMMANDS
              </span>
              <button className="icon-btn" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            
            <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--terminal-text)' }}>
              <p style={{ marginTop: 0 }}>Welcome to <strong>VOIDCHAT</strong>, a real-time retro terminal chatroom.</p>
              
              <h4 style={{ color: 'var(--terminal-primary)', marginBottom: '6px' }}>Available Commands:</h4>
              <ul style={{ paddingLeft: '20px', margin: '0 0 16px 0' }}>
                <li><code>/help</code> - Open this help menu</li>
                <li><code>/clear</code> - Clear local chat messages</li>
                <li><code>/typewriter</code> - Toggle message typewriter effect</li>
                <li><code>/sound</code> - Toggle terminal click audio effects</li>
                <li><code>/theme</code> - Toggle color scheme (Green, Amber, Cyan)</li>
                <li><code>/time</code> - Show current system timestamp</li>
              </ul>

              <h4 style={{ color: 'var(--terminal-primary)', marginBottom: '6px' }}>Terminal Controls:</h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li><strong>Typewriter:</strong> Animate incoming messages character-by-character with terminal block cursor</li>
                <li><strong>Sound:</strong> Synthesized retro mechanical keystroke clicks via Web Audio</li>
                <li><strong>CRT Button:</strong> Toggle retro scanline scan & glow shader</li>
                <li><strong>Palette Button:</strong> Switch between Emerald, Amber, and Cyan themes</li>
                <li><strong>Exit Button:</strong> Leave current chat session and change handle</li>
              </ul>
            </div>

            <button 
              className="btn-primary" 
              style={{ marginTop: '20px' }} 
              onClick={() => setShowHelp(false)}
            >
              Close Help
            </button>
          </div>
        </div>
      )}

      {/* SECRET TERMINAL CONSOLE OVERLAY */}
      {showSecretConsole && (
        <div className="secret-terminal-overlay" onClick={() => setShowSecretConsole(false)}>
          <div className="secret-terminal-modal" onClick={e => e.stopPropagation()}>
            <div className="secret-terminal-header">
              <span>C:\SYSTEM32\SECRET_OVERRIDE.EXE</span>
              <button className="icon-btn" onClick={() => setShowSecretConsole(false)}>✕</button>
            </div>

            <div className="secret-terminal-body">
              <div className="secret-terminal-logs">
                {secretLogs.map((log, index) => (
                  <div key={`log-${index}-${log.substring(0, 15)}`} style={{
                    color: log.startsWith('[+]') ? '#4ade80' : log.startsWith('[-] ') ? '#ef4444' : '#e2e8f0'
                  }}>
                    {log}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSecretSubmit} className="secret-terminal-input-row">
                <span className="secret-prompt-symbol">&gt;</span>
                <input 
                  autoFocus
                  className="secret-terminal-input"
                  value={secretInput}
                  onChange={e => setSecretInput(e.target.value)}
                  placeholder='Type "Going Dark" and press Enter...'
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
