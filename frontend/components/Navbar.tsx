import { useSession } from 'next-auth/react'
import React from 'react'

const Navbar = () => {
    const { data: session, status, update } = useSession()
  return (
    <div>
      
    </div>
  )
}

export default Navbar
