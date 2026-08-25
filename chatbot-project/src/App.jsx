import { useState } from 'react'
import { ChatInput } from './Components/ChatInput';
import ChatMessages from './Components/ChatMessages';
import './App.css'

function App() {

  const [chatMessages, setChatMessages] = useState([{
    message: 'hello chatbot',
    sender: 'user',
    id: 'id1'
  }, {
    message: 'Hello can I help you?',
    sender: 'robot',
    id: 'id2'
  }, {
    message: 'can you get me todays dates?',
    sender: 'user',
    id: 'id3'
  }, {
    message: 'Today is Septemeber 27',
    sender: 'robot',
    id: 'id4'
  }]);
  //const[chatMessages, setChatMessages] = array;
  //const chatMessages = array[0];
  //const setChatMessages = array[1];

  return (
    <div className="app-container">
      
      
      <ChatMessages 
      chatMessages={chatMessages}
      />
      <ChatInput 
      chatMessages={chatMessages}
      setChatMessages={setChatMessages}
      />
    </div>
  );
}

export default App
