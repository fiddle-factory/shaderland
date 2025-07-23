import { getShaderById } from '../../../lib/db'
import ShaderApp from '../../../components/ShaderApp'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShaderPage({ params }: PageProps) {
  const { id } = await params
  const shader = await getShaderById(id)

  if (!shader) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Shader Not Found</h1>
          <p className="text-gray-400 mb-4">The shader you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return <ShaderApp initialShaderData={shader} />
}