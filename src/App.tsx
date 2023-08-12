import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Main from './pages/Main'
import Room from './pages/Room'
import Header from './components/Header'


function App() {

    return (
      <BrowserRouter>
        <Header/>
        <Routes>
          <Route path='/' element={<Main/>}/>
          <Route path='/room/:id' element={<Room/>}/>
          <Route path='*' element={<Navigate to={'/'}/>}/>
        </Routes>
      </BrowserRouter>
    )
}

export default App
