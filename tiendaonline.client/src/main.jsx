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
import { CartProvider } from './context/CartContext'
import { Provider } from 'react-redux' // Importa el Provider de React Redux
import store from './store/index.js'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const queryClient = new QueryClient()

// Carga la clave pública desde las variables de entorno Vite
const stripeKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY : undefined
let stripePromise = null
if (stripeKey && typeof stripeKey === 'string' && stripeKey.trim().length > 0) {
  try {
    stripePromise = loadStripe(stripeKey)
  } catch (err) {
    // Protegemos contra cualquier excepción inesperada durante la carga
    console.error('Error al inicializar Stripe:', err)
    stripePromise = null
  }
} else {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY no está definida — Stripe no se inicializará. Añade la variable en .env (VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... o pk_test_...)')
}

if (!sessionStorage.getItem("sessionId")) {
  // Puedes usar crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const newSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  sessionStorage.setItem("sessionId", newSessionId);
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Provider store={store}> 
          {/* Proporciona Elements alrededor de la app para que cualquier página/componente pueda usar Stripe. */}
          {/* Si stripePromise es null, no envolver con Elements para evitar que stripe-js reciba undefined. */}
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </Elements>
          ) : (
            <>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </>
          )}
        </Provider>
      </CartProvider>
    </QueryClientProvider>
  </StrictMode>
)
