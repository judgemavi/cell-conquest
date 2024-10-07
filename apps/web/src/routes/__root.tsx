import { createRootRouteWithContext, Link } from '@tanstack/react-router';

import logo from '../../public/logo.svg';

export const Route = createRootRouteWithContext<{
  username?: string;
  color?: string;
  guest: boolean;
}>()({
  notFoundComponent: () => (
    <div className='w-screen h-screen flex flex-col justify-center items-center'>
      <h1 className='text-center text-3xl font-bold'>Page not found</h1>
      <Link to='/' className='text-center text-xl font-bold'>
        Go to home
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className='w-screen h-screen flex flex-col justify-center items-center'>
      <h1 className='text-center text-3xl font-bold'>An error occurred</h1>
      <Link to='/' className='text-center text-xl font-bold'>
        Go to home
      </Link>
    </div>
  ),
  pendingComponent: () => (
    <div className='w-screen h-screen flex flex-col justify-center items-center'>
      <img src={logo} className='size-60' alt='logo' />
    </div>
  ),
});
