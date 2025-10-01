'use client'
import { accessAPI } from "@/utils/api";
import { useEffect, useState } from "react";

export default function Home() {

  const [title, setTitle] = useState('Loading...')

  async function fetchTitle() {
    const title = await accessAPI('/', 'GET')
    setTitle(title)
  }

  useEffect(() => {
    fetchTitle()
    console.log(title)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
     <h1 className="text-4xl font-bold text-black">{JSON.stringify(title)}</h1>
    </div>
  );
}
