import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, 
  Message, 
  UserContext, 
  RatePreference, 
  PropertyType, 
  MortgagePackage 
} from './types';
import { 
  INITIAL_CONTEXT, 
  identifyMissingFields, 
  determineNextState, 
  mergeContext 
} from './services/mortgageLogic';
import { extractIntentAndEntities, generateAssistantResponse } from './services/geminiService';
import { fetchPackages } from './services/supabaseService';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import DirectionCard from './components/DirectionCard';
import PackageCard from './components/PackageCard';
import WhatsAppCTA from './components/WhatsAppCTA';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'text',
      content: "Good day. I'm Dexter, your mortgage specialist at The Loan Connection. To get started, could you share if you're looking for a new home loan or refinancing an existing one?"
    }
  ]);
  const [context, setContext] = useState<UserContext>(INITIAL_CONTEXT);
  const [state, setState] = useState<AppState>(AppState.INIT);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() }]);
  };

  const handleUserMessage = async (text: string) => {
    // 1. Add user message
    addMessage({ role: 'user', content: text, type: 'text' });
    setIsLoading(true);

    try {
      // 2. AI Extraction
      const extraction = await extractIntentAndEntities(text, context);
      
      // 3. Update Context & Logic
      const newContext = mergeContext(context, extraction);
      setContext(newContext);
      
      const nextState = determineNextState(newContext, extraction.intent);
      setState(nextState);

      // 4. Handle State Actions
      if (nextState === AppState.FACT_FINDING) {
        // AI generates follow-up question
        const missing = identifyMissingFields(newContext);
        // Pass the context so the AI knows what we ALREADY know
        const responseText = await generateAssistantResponse(text, 'FACT_FINDING', missing, newContext);
        addMessage({ role: 'assistant', content: responseText, type: 'text' });
      } 
      else if (nextState === AppState.DIRECTION_OUTPUT) {
        // Show Directions UI
        addMessage({ 
          role: 'assistant', 
          content: "Thank you. Before I shortlist the packages, let's look at your strategy. In the current market, we generally look at two main directions:", 
          type: 'text' 
        });
        addMessage({ role: 'assistant', content: '', type: 'directions' });
      } 
      else if (nextState === AppState.PACKAGE_RECOMMENDATION) {
        // Fetch Packages
        if (newContext.loanSize && newContext.propertyType !== PropertyType.UNKNOWN) {
           const packages = await fetchPackages(
             newContext.propertyType, 
             newContext.loanSize, 
             newContext.ratePreference
           );
           
           if (packages.length > 0) {
             addMessage({ 
               role: 'assistant', 
               content: `I've screened our database. Based on a loan size of $${newContext.loanSize.toLocaleString()} for a ${newContext.propertyType} property, here are the most competitive ${newContext.ratePreference} options available:`, 
               type: 'text' 
             });
             addMessage({ role: 'assistant', content: '', type: 'packages', data: packages });
           } else {
             addMessage({ 
               role: 'assistant', 
               content: "I've checked our digital database, but I don't see an exact match for those parameters right now. However, we often have offline exclusives for unique cases.", 
               type: 'text' 
             });
           }
           
           // Always show CTA after packages
           setState(AppState.HANDOVER);
        }
      }

    } catch (error) {
      console.error(error);
      addMessage({ role: 'assistant', content: "I apologize, I missed that detail. Could you rephrase?", type: 'text' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectionSelect = async (pref: RatePreference) => {
    // User clicked a card
    const newContext = { ...context, ratePreference: pref };
    setContext(newContext);
    
    // Add fake user message for visual consistency
    addMessage({ role: 'user', content: `I think ${pref} rates suit me better.`, type: 'text' });
    setIsLoading(true);

    // Proceed directly to packages
    setState(AppState.PACKAGE_RECOMMENDATION);
    
    if (newContext.loanSize && newContext.propertyType !== PropertyType.UNKNOWN) {
       const packages = await fetchPackages(
         newContext.propertyType, 
         newContext.loanSize, 
         pref
       );
       
       setIsLoading(false);
       
       addMessage({ 
         role: 'assistant', 
         content: `Excellent choice. Focusing on ${pref} rates, here are the top recommendations for your tier:`, 
         type: 'text' 
       });
       addMessage({ role: 'assistant', content: '', type: 'packages', data: packages });
       setState(AppState.HANDOVER);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ee3238] rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <div>
            <h1 className="font-bold text-[#052d4a] leading-tight text-lg">Dexter</h1>
            <p className="text-xs text-[#03a9e7] font-medium tracking-wide">The Loan Connection</p>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-start pt-4">
          
          {messages.map((msg) => {
             if (msg.type === 'text') {
               return <ChatMessage key={msg.id} message={msg} />;
             } else if (msg.type === 'directions') {
               return <DirectionCard key={msg.id} onSelect={handleDirectionSelect} />;
             } else if (msg.type === 'packages') {
               return (
                 <React.Fragment key={msg.id}>
                   <PackageCard packages={msg.data as MortgagePackage[]} />
                 </React.Fragment>
               );
             }
             return null;
          })}
          
          {/* Handover CTA */}
          {(state === AppState.HANDOVER || messages.some(m => m.type === 'packages')) && (
            <WhatsAppCTA />
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm ml-4 mb-4">
               <div className="w-2 h-2 bg-[#052d4a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-[#052d4a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-[#052d4a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea 
        onSend={handleUserMessage} 
        isLoading={isLoading} 
        disabled={state === AppState.HANDOVER && false} 
      />
    </div>
  );
}

export default App;