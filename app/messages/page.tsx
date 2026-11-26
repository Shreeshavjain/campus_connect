"use client";

import { useState } from "react";
import {
  Search,
  Send,
  MoreVertical,
  MessageCircle,
} from "lucide-react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function MessagesPage() {
  const [message, setMessage] = useState("");

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-130px)] min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex h-full">

          {/* =========================
              LEFT - CONVERSATIONS
          ========================== */}
          <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-white">

            {/* Header */}
            <div className="border-b border-slate-200 p-5">

              <h1 className="text-xl font-bold text-slate-900">
                Messages
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Chat with students from your campus.
              </p>

              {/* Search */}
              <div className="relative mt-4">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4
                  -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    bg-slate-50
                    py-2.5 pl-9 pr-3
                    text-sm text-slate-700
                    outline-none
                    transition
                    focus:border-indigo-400
                    focus:bg-white
                  "
                />
              </div>

            </div>

            {/* Empty conversations */}
            <div className="flex h-[calc(100%-145px)] items-center justify-center p-6">

              <div className="text-center">

                <div className="
                  mx-auto flex h-14 w-14
                  items-center justify-center
                  rounded-full bg-slate-50
                ">
                  <MessageCircle className="h-6 w-6 text-slate-400" />
                </div>

                <h2 className="mt-4 text-sm font-semibold text-slate-800">
                  No conversations yet
                </h2>

                <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
                  Your conversations with other students will appear here.
                </p>

              </div>

            </div>

          </aside>


          {/* =========================
              RIGHT - CHAT
          ========================== */}
          <section className="flex min-w-0 flex-1 flex-col">

            {/* Chat header */}
            <header className="
              flex h-[72px]
              items-center justify-between
              border-b border-slate-200
              px-6
            ">

              <div className="flex items-center gap-3">

                <div className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-full
                  bg-indigo-50
                  text-indigo-500
                ">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Messages
                  </h2>

                  <p className="text-xs text-slate-400">
                    Select a conversation to start chatting
                  </p>
                </div>

              </div>

              {/* Only menu — no call / video / online */}
              <button
                type="button"
                className="
                  rounded-lg p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
              >
                <MoreVertical className="h-5 w-5" />
              </button>

            </header>


            {/* =========================
                EMPTY CHAT AREA
            ========================== */}
            <div className="
              flex flex-1
              items-center justify-center
              bg-slate-50/60
              p-6
            ">

              <div className="max-w-sm text-center">

                <div className="
                  mx-auto flex h-16 w-16
                  items-center justify-center
                  rounded-full
                  bg-white
                  shadow-sm
                  ring-1 ring-slate-200
                ">
                  <MessageCircle className="h-7 w-7 text-indigo-500" />
                </div>

                <h2 className="
                  mt-5 text-lg
                  font-semibold text-slate-900
                ">
                  Your messages
                </h2>

                <p className="
                  mt-2 text-sm
                  leading-6 text-slate-500
                ">
                  Select a student from your conversations
                  to view your messages here.
                </p>

              </div>

            </div>


            {/* =========================
                MESSAGE INPUT
            ========================== */}
            <div className="
              border-t border-slate-200
              bg-white p-4
            ">

              <div className="flex items-center gap-3">

                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Select a conversation to send a message..."
                  disabled
                  className="
                    flex-1
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-4 py-3
                    text-sm text-slate-500
                    outline-none
                    disabled:cursor-not-allowed
                  "
                />

                <button
                  type="button"
                  disabled
                  className="
                    flex h-11 w-11
                    shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-indigo-600
                    text-white
                    opacity-40
                    cursor-not-allowed
                  "
                >
                  <Send className="h-4 w-4" />
                </button>

              </div>

              <p className="
                mt-2 text-center
                text-[10px] text-slate-400
              ">
                Messaging will be connected to the backend.
              </p>

            </div>

          </section>

        </div>

      </div>
    </DashboardLayout>
  );
}