import { createFileRoute, redirect } from '@tanstack/react-router'


export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const user = localStorage.getItem("user")

    if (!user) {
      throw redirect({ to: "/login" })
    }

    throw redirect({ to: "/chat" })
  },
})