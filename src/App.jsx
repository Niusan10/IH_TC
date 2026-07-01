import { useEffect, useRef, useState } from 'react'
import './App.css'

const ALLOWED_DOMAIN = 'todocesped.es'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  const [email, setEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [message, setMessage] = useState('Entra con Google o con tu email corporativo para ver la demo interna.')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const googleButtonRef = useRef(null)

  const decodeJwtPayload = (token) => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload)
  }

  const handleCredentialResponse = (response) => {
    if (!response?.credential) {
      setMessage('No se pudo completar el acceso con Google.')
      return
    }

    const payload = decodeJwtPayload(response.credential)
    const userEmail = payload.email?.toLowerCase() || ''

    if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setMessage(`Solo se permiten cuentas con dominio @${ALLOWED_DOMAIN}.`)
      setEmail('')
      setDisplayName('')
      setAvatarUrl('')
      setIsAuthenticated(false)
      window.localStorage.removeItem('ih-tc-email')
      return
    }

    window.localStorage.setItem('ih-tc-email', userEmail)
    setEmail(userEmail)
    setDisplayName(payload.name || userEmail)
    setAvatarUrl(payload.picture || '')
    setIsAuthenticated(true)
    setMessage(`Acceso permitido para ${userEmail}`)
  }

  useEffect(() => {
    const storedEmail = window.localStorage.getItem('ih-tc-email')
    if (storedEmail) {
      setEmail(storedEmail)
      setIsAuthenticated(true)
      setMessage(`Bienvenido, ${storedEmail}`)
    }
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id || !googleButtonRef.current) {
      return
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
    })
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage('Introduce un correo válido para entrar.')
      return
    }

    if (!normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setMessage(`Solo se admiten correos con dominio @${ALLOWED_DOMAIN}.`)
      return
    }

    window.localStorage.setItem('ih-tc-email', normalizedEmail)
    setIsAuthenticated(true)
    setMessage(`Acceso permitido para ${normalizedEmail}`)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('ih-tc-email')
    setEmail('')
    setDisplayName('')
    setAvatarUrl('')
    setIsAuthenticated(false)
    setMessage('Sesión cerrada. Puedes entrar otra vez con tu cuenta autorizada.')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">IH_TC</div>
        <div className="pill">Césped artificial • Instalaciones</div>
      </header>

      <main className="hero-block">
        <section className="hero-copy">
          <p className="eyebrow">Instalaciones simples y profesionales</p>
          <h1>La APP de instalaciones para el más tonto de la isla</h1>
          <p className="lead">
            Gestiona pedidos, visitas y entregas desde un solo lugar con un proceso claro para cada instalación de césped artificial.
          </p>
          <div className="actions">
            <a href="#acceso" className="btn btn-primary">
              Entrar con Google o email
            </a>
          </div>
        </section>

        <section className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
            alt="Instalación de césped artificial en exterior"
          />
        </section>
      </main>

      <section className="access-card" id="acceso">
        {!isAuthenticated ? (
          <>
            <h2>Accede a la demo</h2>
            <p>Inicia sesión con Google o introduce tu email corporativo del dominio @todocesped.es.</p>

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} className="google-button" />
            ) : (
              <p className="status">Añade tu VITE_GOOGLE_CLIENT_ID para habilitar Google Sign-In.</p>
            )}

            <div className="divider">o</div>

            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@todocesped.es"
                required
              />
              <button type="submit">Entrar</button>
            </form>
            <p className="status">{message}</p>
          </>
        ) : (
          <>
            <h2>Panel listo</h2>
            <div className="user-card">
              {avatarUrl ? <img src={avatarUrl} alt={displayName || email} className="avatar" /> : null}
              <div>
                <p className="user-name">{displayName || email}</p>
                <p>Tu acceso está activado para {email}.</p>
              </div>
            </div>
            <div className="dashboard-card">
              <span>📍 12 proyectos activos</span>
              <span>🌿 4 instalaciones esta semana</span>
              <span>✅ 98% de satisfacción</span>
            </div>
            <button type="button" className="btn btn-secondary full-width" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        )}
      </section>
    </div>
  )
}

export default App
