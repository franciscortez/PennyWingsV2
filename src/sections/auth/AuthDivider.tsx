export function AuthDivider() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-pink-100" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-4 font-medium text-pink-400">
          Or continue with
        </span>
      </div>
    </div>
  )
}
