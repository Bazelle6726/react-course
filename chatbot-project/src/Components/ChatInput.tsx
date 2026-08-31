import { useState } from 'react'
import { Chatbot } from 'supersimpledev';
import './ChatInput.css';
import './ChatMessage.css';
import React from 'react';

type ChatInputProps = {
    chatMessages: {
        message: string;
        sender: string;
        id: string;
    }[];
    setChatMessages: React.Dispatch<React.SetStateAction<{
        message: string;
        sender: string;
        id: string;
    }[]>>;
};

export function ChatInput({chatMessages, setChatMessages}: ChatInputProps) {
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    function saveInputText(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value);
    }

    async function sendMessage(){
    if(isLoading || inputText === '') {
        return;
    }
    //true at beginning, false after its done
    setIsLoading(true);

    setInputText('');

    const newChatMessages = [
        ...chatMessages,
        {
        message: inputText,
        sender: 'user',
        id: crypto.randomUUID()
        }
    ];

    setChatMessages([
        ...newChatMessages,
        {
            message: 'Loading...',
            sender: 'robot',
            id: crypto.randomUUID()
        }
        ]);
    

    const response = await Chatbot.getResponseAsync(inputText);
    setChatMessages([
        ...newChatMessages,
        {
        message: response,
        sender: 'robot',
        id: crypto.randomUUID()
        }
    ]);
    setIsLoading(false);
    }

    function handleKeyDown (event: React.KeyboardEvent<HTMLInputElement>) {
        if(event.key === 'Enter'){
        sendMessage();
        }else if (event.key === 'Escape') {
        setInputText('');
        }
    }
    
    
    return (
    <div className="chat-input-container">
        <input 
        placeholder="Send a message to chatbot" 
        size="30" 
        onChange={saveInputText}
        onKeyDown={handleKeyDown}
        value={inputText}
        className="chat-input"
        />
        <button
        onClick={sendMessage}
        className="send-button"
        >Send</button>
    </div>
    );
}