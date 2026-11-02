import Link from "next/link";
import { Github, Heart, ShieldCheck, ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Decor } from "@/components/Decor";
import { getSession } from "@/lib/session";
export default async function LoginPage() {
  const s = await getSession();
  return <main className="relative min-h-screen overflow-hidden"><Decor/><Topbar login={s.login}/><div className="relative z-10 mx-auto flex min-h-[75vh] max-w-xl items-center px-5 py-12"><div className="soft-card w-full rounded-[2rem] p-7 text-center md:p-10">
    <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-[#292426] text-white"><Github size={30}/></div>
    <p className="text-xs tracking-[.25em] text-[#ad898a]">WELCOME TO XIYU</p><h1 className="serif mt-3 text-4xl">Let’s get you connected.</h1>
    <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#8b7a7a]">Sign in with GitHub to create repositories and upload your project files.</p>
    {s.login ? <div className="mt-7 rounded-2xl bg-[#f8efeb] p-4 text-sm">You’re signed in as <b>@{s.login}</b>.<Link className="ml-2 underline" href="/dashboard">Open dashboard</Link></div> : <a href="/api/auth/github" className="btn-primary mt-8 flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"><Github size={19}/> Continue with GitHub</a>}
    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#9a8585]"><ShieldCheck size={14}/> Secure authorization · No password shared</div>
    <Link href="/" className="mt-8 inline-flex items-center gap-2 text-xs text-[#9a8585]"><ArrowLeft size={14}/> Back home</Link>
  </div></div></main>;
}
