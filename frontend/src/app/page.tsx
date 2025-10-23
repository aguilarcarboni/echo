'use client'
import { User } from "@/lib/user";
import { ReadUsers } from "@/utils/user";
import { useEffect, useState } from "react";

export default function Home() {

  const [users, setUsers] = useState<User[] | null>(null)

  async function handleFetchUsers() {
    const users = await ReadUsers()
    setUsers(users)
  }

  useEffect(() => {
    handleFetchUsers()
  }, [])
  
  if (!users) return <div className="flex flex-col items-center justify-center h-screen bg-white">Loading...</div>

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
     <h1 className="text-4xl font-bold text-black">{JSON.stringify(users)}</h1>
    </div>
  );
}
