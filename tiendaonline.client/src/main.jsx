// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css'
import App from './App.jsx'
import { SpinnerProvider } from './context/SpinnerContext.jsx'
import { CartProvider } from './context/CartContext'
import { Provider } from 'react-redux' // Importa el Provider de React Redux
import store from './store/index.js'


const queryClient = new QueryClient()

if (!sessionStorage.getItem("sessionId")) {
  // Puedes usar crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const newSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  sessionStorage.setItem("sessionId", newSessionId);
}


createRoot(document.getElementById('root')).render(

  
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <SpinnerProvider>
          <CartProvider>
            <Provider store={store}> 
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </Provider>
          </CartProvider>
        </SpinnerProvider>
      </QueryClientProvider>
    </StrictMode>
 
)
