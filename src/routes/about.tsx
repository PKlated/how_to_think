import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <section className="bg-white rounded-xl p-8 shadow">
        <h1 className="text-4xl font-bold mb-4">
          About This Project
        </h1>

        <p className="text-gray-600 leading-7">
          This project is built using React and TanStack Router.
          It will be used to manage our application features
          and provide a scalable web platform.
        </p>
      </section>
    </main>
  )
}