import { signIn } from "@/auth";
import React from 'react';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в KubanRoute
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Авторизуйтесь, чтобы мы могли строить для вас персональные маршруты
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-4">
          
          <form
            action={async () => {
              "use server"
              await signIn("yandex", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#FFCC00] hover:bg-[#E5B800] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFCC00] transition-colors"
            >
              Войти через Яндекс
            </button>
          </form>

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Войти через Google
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
