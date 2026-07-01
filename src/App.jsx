import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const ALLOWED_DOMAIN = 'todocesped.es'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const localImages = import.meta.glob('./assets/*', { eager: true, import: 'default' })
const logoImage = localImages['./assets/ibigrass-logo.svg'] || localImages['./assets/ibigrass-logo.png'] || ''
const heroImage = localImages['./assets/landing-grass.jpg'] || localImages['./assets/landing-grass.png'] || localImages['./assets/hero.png'] || ''

const STORAGE_KEYS = {
  currentEmail: 'ih-tc-email',
  allowedUsers: 'ih-tc-allowed-users',
  adminEmail: 'ih-tc-admin-email',
  participants: 'ih-tc-participants',
  works: 'ih-tc-works',
}

const defaultWork = {
  name: '',
  address: '',
  date: new Date().toISOString().slice(0, 10),
  revenue: '',
  participants: [],
  hours: [],
  expenses: [],
  notes: '',
}

const CATEGORY_OPTIONS = ['Tierra', 'Césped', 'Camión pluma', 'Otros']

const loadStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

const saveStorage = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const mapLink = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

function App() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [message, setMessage] = useState('Entra con Google o con tu email corporativo para ver la intranet.')
  const [page, setPage] = useState('dashboard')
  const [allowedUsers, setAllowedUsers] = useState([])
  const [adminEmail, setAdminEmail] = useState('')
  const [participants, setParticipants] = useState([])
  const [works, setWorks] = useState([])
  const [selectedWorkId, setSelectedWorkId] = useState(null)
  const [filterDates, setFilterDates] = useState({ from: '', to: '' })
  const [newWork, setNewWork] = useState(defaultWork)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newAllowedEmail, setNewAllowedEmail] = useState('')
  const googleButtonRef = useRef(null)

  useEffect(() => {
    const storedEmail = window.localStorage.getItem(STORAGE_KEYS.currentEmail)
    const storedAllowed = loadStorage(STORAGE_KEYS.allowedUsers, [])
    const storedAdmin = window.localStorage.getItem(STORAGE_KEYS.adminEmail) || ''
    const storedParticipants = loadStorage(STORAGE_KEYS.participants, [])
    const storedWorks = loadStorage(STORAGE_KEYS.works, [])

    setAllowedUsers(storedAllowed)
    setAdminEmail(storedAdmin)
    setParticipants(storedParticipants)
    setWorks(storedWorks)

    if (storedEmail && storedAllowed.length > 0 && storedAllowed.includes(storedEmail)) {
      setEmail(storedEmail)
      setIsAuthenticated(true)
      setMessage(`Bienvenido de nuevo, ${storedEmail}`)
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
  }, [googleButtonRef.current])

  useEffect(() => {
    saveStorage(STORAGE_KEYS.allowedUsers, allowedUsers)
  }, [allowedUsers])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.adminEmail, adminEmail)
  }, [adminEmail])

  useEffect(() => {
    saveStorage(STORAGE_KEYS.participants, participants)
  }, [participants])

  useEffect(() => {
    saveStorage(STORAGE_KEYS.works, works)
  }, [works])

  const currentUserIsAdmin = useMemo(() => email === adminEmail, [email, adminEmail])

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

  const authorizeUser = (normalizedEmail) => {
    if (allowedUsers.length === 0) {
      setAllowedUsers([normalizedEmail])
      setAdminEmail(normalizedEmail)
      return true
    }

    return allowedUsers.includes(normalizedEmail)
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
      return
    }

    if (!authorizeUser(userEmail)) {
      setMessage('Usuario no autorizado. El admin debe añadirte primero.')
      return
    }

    window.localStorage.setItem(STORAGE_KEYS.currentEmail, userEmail)
    setEmail(userEmail)
    setDisplayName(payload.name || userEmail)
    setAvatarUrl(payload.picture || '')
    setIsAuthenticated(true)
    setMessage(`Acceso permitido para ${userEmail}`)
  }

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

    if (!authorizeUser(normalizedEmail)) {
      setMessage('Usuario no autorizado. El admin debe añadirte primero.')
      return
    }

    window.localStorage.setItem(STORAGE_KEYS.currentEmail, normalizedEmail)
    setEmail(normalizedEmail)
    setDisplayName(normalizedEmail)
    setIsAuthenticated(true)
    setMessage(`Acceso permitido para ${normalizedEmail}`)
  }

  const handleLogout = () => {
    window.localStorage.removeItem(STORAGE_KEYS.currentEmail)
    setEmail('')
    setDisplayName('')
    setAvatarUrl('')
    setIsAuthenticated(false)
    setPage('dashboard')
    setMessage('Sesión cerrada. Puedes entrar otra vez con tu cuenta autorizada.')
  }

  const addAllowedUser = () => {
    const normalizedEmail = newAllowedEmail.trim().toLowerCase()
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage('Introduce un correo válido para autorizar.')
      return
    }
    if (!normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setMessage(`Solo se permiten correos @${ALLOWED_DOMAIN}.`)
      return
    }
    if (allowedUsers.includes(normalizedEmail)) {
      setMessage('Ese usuario ya está autorizado.')
      return
    }
    setAllowedUsers((prev) => [...prev, normalizedEmail])
    setNewAllowedEmail('')
    setMessage(`Usuario autorizado: ${normalizedEmail}`)
  }

  const removeAllowedUser = (user) => {
    setAllowedUsers((prev) => prev.filter((email) => email !== user))
    if (user === adminEmail) {
      setAdminEmail('')
      setMessage('Admin eliminado. La próxima login volverá a establecer un admin.')
    }
  }

  const addParticipant = () => {
    const name = newParticipantName.trim()
    if (!name) return
    if (!participants.includes(name)) {
      setParticipants((prev) => [...prev, name])
    }
    setNewParticipantName('')
  }

  const updateNewWork = (field, value) => {
    setNewWork((prev) => ({ ...prev, [field]: value }))
  }

  const toggleParticipant = (name) => {
    setNewWork((prev) => {
      const exists = prev.participants.includes(name)
      const participants = exists
        ? prev.participants.filter((item) => item !== name)
        : [...prev.participants, name]
      return { ...prev, participants }
    })
  }

  const updateHour = (index, field, value) => {
    setNewWork((prev) => {
      const hours = [...prev.hours]
      hours[index] = { ...hours[index], [field]: value }
      return { ...prev, hours }
    })
  }

  const addHourRow = () => {
    setNewWork((prev) => ({ ...prev, hours: [...prev.hours, { employee: '', hours: '' }] }))
  }

  const removeHourRow = (index) => {
    setNewWork((prev) => ({ ...prev, hours: prev.hours.filter((_, i) => i !== index) }))
  }

  const updateExpense = (index, field, value) => {
    setNewWork((prev) => {
      const expenses = [...prev.expenses]
      expenses[index] = { ...expenses[index], [field]: value }
      return { ...prev, expenses }
    })
  }

  const addExpenseRow = () => {
    setNewWork((prev) => ({ ...prev, expenses: [...prev.expenses, { category: CATEGORY_OPTIONS[0], amount: '' }] }))
  }

  const removeExpenseRow = (index) => {
    setNewWork((prev) => ({ ...prev, expenses: prev.expenses.filter((_, i) => i !== index) }))
  }

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId),
    [works, selectedWorkId]
  )

  const filteredWorks = useMemo(() => {
    const fromDate = filterDates.from ? new Date(filterDates.from) : null
    const toDate = filterDates.to ? new Date(filterDates.to) : null

    return works.filter((work) => {
      const workDate = new Date(work.date)
      if (fromDate && workDate < fromDate) return false
      if (toDate && workDate > toDate) return false
      return true
    })
  }, [works, filterDates])

  const totals = useMemo(() => {
    const totalRevenue = filteredWorks.reduce((sum, work) => sum + Number(work.revenue || 0), 0)
    const totalExpenses = filteredWorks.reduce((sum, work) => sum + Number(work.expensesTotal || 0), 0)
    return {
      revenue: totalRevenue,
      profit: totalRevenue - totalExpenses,
      installations: filteredWorks.length,
    }
  }, [filteredWorks])

  const createCode = (date) => {
    const year = new Date(date).getFullYear()
    const sequence = works.filter((work) => new Date(work.date).getFullYear() === year).length + 1
    return `${year}/${sequence}`
  }

  const addWork = () => {
    if (!newWork.name.trim() || !newWork.address.trim() || !newWork.revenue) {
      setMessage('Rellena al menos nombre, dirección y facturación de la obra.')
      return
    }

    const expensesTotal = newWork.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const profit = Number(newWork.revenue || 0) - expensesTotal
    const code = createCode(newWork.date)
    const work = {
      id: Date.now().toString(),
      code,
      ...newWork,
      revenue: Number(newWork.revenue || 0),
      expensesTotal,
      profit,
      createdAt: new Date().toISOString(),
    }

    const employeeNames = newWork.hours.flatMap((item) => (item.employee ? [item.employee] : []))
    const combinedParticipants = Array.from(new Set([...participants, ...newWork.participants, ...employeeNames]))
    setParticipants(combinedParticipants)
    setWorks((prev) => [work, ...prev])
    setNewWork(defaultWork)
    setMessage('Obra creada correctamente.')
    setPage('list')
  }

  if (!isAuthenticated) {
    return (
      <div className="page-shell">
        <header className="topbar">
          <div className="brand">IbiGrass Intranet</div>
          <div className="pill">Gestión de obras de césped artificial</div>
        </header>

        <main className="hero-block">
          <section className="hero-copy">
            {logoImage && <img src={logoImage} alt="IbiGrass logo" className="brand-logo" />}
            <p className="eyebrow">Intranet profesional</p>
            <h1>Gestión de obras de césped artificial y KPI de instalaciones</h1>
            <p className="lead">
              Controla obras, equipos y finanzas desde un panel interno seguro para tu equipo.
            </p>
            <div className="actions">
              <a href="#acceso" className="btn btn-primary">
                Acceder al panel
              </a>
            </div>
          </section>

          <section className="hero-media">
            <img
              src={heroImage || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'}
              alt="Instalación de césped artificial en exterior"
            />
          </section>
        </main>

        <section className="access-card" id="acceso">
          <h2>Accede a la intranet</h2>
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
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          {logoImage && <img src={logoImage} alt="IbiGrass" className="sidebar-logo" />}
          <div>
            <strong>IbiGrass</strong>
            <p>Intranet de obras</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={page === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={page === 'new-work' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('new-work')}>
            Nueva obra
          </button>
          <button className={page === 'list' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('list')}>
            Listado de instalaciones
          </button>
          {currentUserIsAdmin && (
            <button className={page === 'admin' ? 'nav-item active' : 'nav-item'} onClick={() => setPage('admin')}>
              Admin usuarios
            </button>
          )}
        </nav>

        <div className="user-panel">
          <div className="user-card-side">
            {avatarUrl ? <img src={avatarUrl} alt={displayName || email} className="avatar" /> : <div className="avatar-placeholder">IB</div>}
            <div>
              <p>{displayName || email}</p>
              <small>{currentUserIsAdmin ? 'Admin' : 'Usuario'}</small>
            </div>
          </div>
          <button className="btn btn-secondary full-width" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Intranet IbiGrass</p>
            <h1>{page === 'dashboard' ? 'Dashboard' : page === 'new-work' ? 'Nueva obra' : page === 'list' ? 'Listado de instalaciones' : 'Administración de usuarios'}</h1>
          </div>
          <p className="status-bar">{message}</p>
        </header>

        {page === 'dashboard' && (
          <section>
            <div className="cards-grid">
              <article className="kpi-card">
                <p>Facturación</p>
                <strong>{totals.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>
              </article>
              <article className="kpi-card">
                <p>Beneficio</p>
                <strong>{totals.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>
              </article>
              <article className="kpi-card">
                <p>Instalaciones</p>
                <strong>{totals.installations}</strong>
              </article>
            </div>

            <section className="panel-block">
              <div className="panel-header">
                <h2>Filtrar por fechas</h2>
              </div>
              <div className="filter-row">
                <label>
                  Desde
                  <input type="date" value={filterDates.from} onChange={(event) => setFilterDates((prev) => ({ ...prev, from: event.target.value }))} />
                </label>
                <label>
                  Hasta
                  <input type="date" value={filterDates.to} onChange={(event) => setFilterDates((prev) => ({ ...prev, to: event.target.value }))} />
                </label>
              </div>
            </section>

            <section className="panel-block">
              <div className="panel-header">
                <h2>Instalaciones recientes</h2>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Obra</th>
                      <th>Fecha</th>
                      <th>Facturación</th>
                      <th>Beneficio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorks.length === 0 ? (
                      <tr>
                        <td colSpan="5">No hay obras en el rango seleccionado.</td>
                      </tr>
                    ) : (
                      filteredWorks.map((work) => (
                        <tr key={work.id} onClick={() => { setSelectedWorkId(work.id); setPage('summary') }}>
                          <td>{work.code}</td>
                          <td>{work.name}</td>
                          <td>{work.date}</td>
                          <td>{work.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                          <td>{work.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

        {page === 'new-work' && (
          <section className="panel-block">
            <div className="panel-header">
              <h2>Crear nueva obra</h2>
            </div>
            <div className="form-grid">
              <label>
                Nombre de la obra
                <input type="text" value={newWork.name} onChange={(event) => updateNewWork('name', event.target.value)} />
              </label>
              <label>
                Dirección
                <input type="text" value={newWork.address} onChange={(event) => updateNewWork('address', event.target.value)} />
              </label>
              <label>
                Fecha de la obra
                <input type="date" value={newWork.date} onChange={(event) => updateNewWork('date', event.target.value)} />
              </label>
              <label>
                Facturación EUR
                <input type="number" min="0" value={newWork.revenue} onChange={(event) => updateNewWork('revenue', event.target.value)} />
              </label>
            </div>

            <div className="panel-section">
              <h3>Personas en la obra</h3>
              <div className="flex-row gap">
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(event) => setNewParticipantName(event.target.value)}
                  placeholder="Añadir participante"
                />
                <button type="button" className="btn btn-primary" onClick={addParticipant}>
                  Añadir
                </button>
              </div>
              <div className="chips-row">
                {participants.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className={newWork.participants.includes(name) ? 'chip selected' : 'chip'}
                    onClick={() => toggleParticipant(name)}
                  >
                    {name}
                  </button>
                ))}
                {participants.length === 0 && <p className="muted">Añade participantes para acceder rápido al selector.</p>}
              </div>
            </div>

            <div className="panel-section">
              <h3>Horas por empleado</h3>
              <button type="button" className="btn btn-secondary small" onClick={addHourRow}>
                Añadir fila
              </button>
              <div className="table-scroll small-table">
                <table>
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Horas</th>
                      <th>Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newWork.hours.map((hour, index) => (
                      <tr key={`${hour.employee}-${index}`}>
                        <td>
                          <input
                            type="text"
                            value={hour.employee}
                            onChange={(event) => updateHour(index, 'employee', event.target.value)}
                            placeholder="Nombre"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={hour.hours}
                            onChange={(event) => updateHour(index, 'hours', event.target.value)}
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-tertiary" onClick={() => removeHourRow(index)}>
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                    {newWork.hours.length === 0 && (
                      <tr>
                        <td colSpan="3" className="muted">
                          Añade las horas empleadas por cada trabajador.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel-section">
              <h3>Gastos</h3>
              <button type="button" className="btn btn-secondary small" onClick={addExpenseRow}>
                Añadir partida
              </button>
              <div className="table-scroll small-table">
                <table>
                  <thead>
                    <tr>
                      <th>Partida</th>
                      <th>Coste EUR</th>
                      <th>Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newWork.expenses.map((expense, index) => (
                      <tr key={`${expense.category}-${index}`}>
                        <td>
                          <select value={expense.category} onChange={(event) => updateExpense(index, 'category', event.target.value)}>
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={expense.amount}
                            onChange={(event) => updateExpense(index, 'amount', event.target.value)}
                          />
                        </td>
                        <td>
                          <button type="button" className="btn btn-tertiary" onClick={() => removeExpenseRow(index)}>
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                    {newWork.expenses.length === 0 && (
                      <tr>
                        <td colSpan="3" className="muted">
                          Añade los costes de tierra, césped, camión pluma y otros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <label>
              Notas internas
              <textarea value={newWork.notes} onChange={(event) => updateNewWork('notes', event.target.value)} rows="4" />
            </label>

            <div className="buttons-row">
              <button type="button" className="btn btn-primary" onClick={addWork}>
                Guardar obra
              </button>
            </div>
          </section>
        )}

        {page === 'list' && (
          <section className="panel-block">
            <div className="panel-header">
              <h2>Listado de instalaciones</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Obra</th>
                    <th>Fecha</th>
                    <th>Facturación</th>
                    <th>Beneficio</th>
                  </tr>
                </thead>
                <tbody>
                  {works.length === 0 ? (
                    <tr>
                      <td colSpan="5">No hay instalaciones registradas todavía.</td>
                    </tr>
                  ) : (
                    works.map((work) => (
                      <tr key={work.id} onClick={() => { setSelectedWorkId(work.id); setPage('summary') }}>
                        <td>{work.code}</td>
                        <td>{work.name}</td>
                        <td>{work.date}</td>
                        <td>{work.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                        <td>{work.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === 'summary' && selectedWork && (
          <section className="panel-block">
            <div className="panel-header space-between">
              <div>
                <h2>{selectedWork.name}</h2>
                <p className="muted">Código {selectedWork.code} • {selectedWork.date}</p>
              </div>
              <button className="btn btn-secondary small" onClick={() => setPage('list')}>
                Volver al listado
              </button>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <p>Dirección</p>
                <strong>{selectedWork.address}</strong>
                {selectedWork.address && (
                  <a className="link" href={mapLink(selectedWork.address)} target="_blank" rel="noreferrer">
                    Abrir en Google Maps
                  </a>
                )}
              </div>
              <div className="summary-card">
                <p>Facturación</p>
                <strong>{selectedWork.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>
                <p>Beneficio</p>
                <strong>{selectedWork.profit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong>
              </div>
            </div>

            <div className="panel-section">
              <h3>Participantes</h3>
              <div className="chips-row">
                {selectedWork.participants.map((name) => (
                  <span key={name} className="chip selected">
                    {name}
                  </span>
                ))}
                {selectedWork.participants.length === 0 && <p className="muted">Sin participantes.</p>}
              </div>
            </div>

            <div className="panel-section two-col">
              <div>
                <h3>Horas trabajadas</h3>
                <div className="table-scroll small-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Empleado</th>
                        <th>Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWork.hours.map((hour, index) => (
                        <tr key={`${hour.employee}-${index}`}>
                          <td>{hour.employee || '-'}</td>
                          <td>{hour.hours || 0}</td>
                        </tr>
                      ))}
                      {selectedWork.hours.length === 0 && (
                        <tr>
                          <td colSpan="2" className="muted">
                            No hay horas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3>Gastos</h3>
                <div className="table-scroll small-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Partida</th>
                        <th>Coste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWork.expenses.map((expense, index) => (
                        <tr key={`${expense.category}-${index}`}>
                          <td>{expense.category}</td>
                          <td>{Number(expense.amount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                        </tr>
                      ))}
                      {selectedWork.expenses.length === 0 && (
                        <tr>
                          <td colSpan="2" className="muted">
                            No hay gastos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {selectedWork.notes && (
              <div className="panel-section">
                <h3>Notas</h3>
                <p>{selectedWork.notes}</p>
              </div>
            )}
          </section>
        )}

        {page === 'admin' && currentUserIsAdmin && (
          <section className="panel-block">
            <div className="panel-header">
              <h2>Administrar usuarios de la intranet</h2>
            </div>
            <div className="form-grid two-col">
              <label>
                Añadir usuario autorizado
                <input type="email" value={newAllowedEmail} onChange={(event) => setNewAllowedEmail(event.target.value)} placeholder="usuario@todocesped.es" />
              </label>
              <div className="buttons-row">
                <button type="button" className="btn btn-primary" onClick={addAllowedUser}>
                  Autorizar usuario
                </button>
              </div>
            </div>
            <div className="panel-section">
              <h3>Usuarios autorizados</h3>
              <div className="table-scroll small-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowedUsers.map((userEmail) => (
                      <tr key={userEmail}>
                        <td>{userEmail}</td>
                        <td>{userEmail === adminEmail ? 'Admin' : 'Usuario'}</td>
                        <td>
                          <button type="button" className="btn btn-tertiary" onClick={() => removeAllowedUser(userEmail)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allowedUsers.length === 0 && (
                      <tr>
                        <td colSpan="3" className="muted">
                          No hay usuarios autorizados. El primer usuario que entre será el admin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
