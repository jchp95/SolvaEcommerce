import React, { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import apiClient from '../../api/client'
import { Button, Spinner, Alert } from 'react-bootstrap'

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#a0aec0' }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
}

export default function CheckoutForm({ orderId, supplierId, amount, email, name, currency = 'usd', onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe aún no está cargado. Intenta de nuevo en unos segundos.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Elemento de tarjeta no encontrado')
      return
    }

    setIsProcessing(true)

    try {
      // Crear token (deprecated for PaymentIntent flow but server expects a token)
      const { error: tokenError, token } = await stripe.createToken(cardElement)
      if (tokenError) {
        setError(tokenError.message)
        setIsProcessing(false)
        if (onError) onError(tokenError)
        return
      }

      const payload = {
        OrderId: orderId,
        SupplierId: supplierId,
        StripeToken: token.id,
        Name: name || 'Compra',
        Amount: amount,
        Email: email || '',
        Currency: currency,
        Description: `Pago orden ${orderId}`
      }

      const response = await apiClient.post('/Stripe/procesar-pago-stripe', payload)

      if (response?.data?.success) {
        if (onSuccess) onSuccess(response.data)
      } else {
        const message = response?.data?.message || 'Error procesando el pago'
        setError(message)
        if (onError) onError(response.data)
      }

    } catch (err) {
      console.error('Error procesando pago:', err)
      setError(err.response?.data?.message || err.message || 'Error desconocido')
      if (onError) onError(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="mb-3">
        <label className="form-label text-light">Tarjeta de crédito / débito</label>
        <div className="p-2 border rounded bg-dark bg-opacity-10">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      <Button type="submit" variant="primary" className="w-100" disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" /> Procesando pago...
          </>
        ) : (
          `Pagar $${(amount || 0).toFixed(2)}`
        )}
      </Button>
    </form>
  )
}

