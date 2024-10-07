import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useRouter,
} from '@tanstack/react-router';
import { TooltipProvider } from '../components/Tooltip';
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../components/NavigationMenu';
import { Separator } from '../components/Separator';
import { Button, SpinnerButton } from '../components/Button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/AletDialog';
import { Input } from '../components/Input';
import { useState } from 'react';
import { useCreatePlayer, useDeletePlayer } from '../utils/hooks';
import { generateUniqueColorFromUsername } from '@repo/utils';
import logo from '../../public/logo.svg';

const Layout = () => {
  const routes = [
    {
      label: 'Sandbox',
      path: '/sandbox',
    },
    {
      label: 'Rules',
      path: '/rules',
    },
  ];

  const location = useLocation();

  const context = Route.useRouteContext();

  const [createPlayerDialogOpen, setCreatePlayerDialogOpen] = useState(false);

  const { mutate: deletePlayer } = useDeletePlayer();

  const handleClick = () => {
    if (context.username) {
      deletePlayer();
    } else {
      setCreatePlayerDialogOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <div className='container bg-white flex flex-col h-screen overflow-hidden items-center pb-4 px-2 md:px-8'>
        <div className='flex item-center py-4 w-full'>
          <Link to='/' className='flex gap-2 items-center'>
            <img src={logo} className='w-12 h-12' alt='logo' />
            <span className='text-3xl font-bold sr-only sm:not-sr-only'>
              Cell Conquest
            </span>
          </Link>
          <div className='flex gap-2 items-center flex-1 justify-end'>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem asChild>
                  <Button
                    variant={context.username ? 'destructive' : 'default'}
                    onClick={handleClick}
                  >
                    {context.username ? 'End' : 'Play'}
                  </Button>
                </NavigationMenuItem>
                {routes.map((route) => (
                  <NavigationMenuItem key={route.path}>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                      active={route.path === location.pathname}
                    >
                      <Link to={route.path}>{route.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}

                <NavigationMenuIndicator />
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <Separator />
        <Outlet />
      </div>
      <CreatePlayerDialog
        open={createPlayerDialogOpen}
        onOpenChange={setCreatePlayerDialogOpen}
      />
    </TooltipProvider>
  );
};

const CreatePlayerDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const {
    mutateAsync: createPlayer,
    isPending,
    isError,
    error,
  } = useCreatePlayer();

  const handleSubmit = async () => {
    const data = await createPlayer(username);
    if (data) {
      onOpenChange(false);
      router.navigate({
        to: '/',
      });
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create a player</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          A random color will be generated for you based on your username.
        </AlertDialogDescription>
        <div className='flex gap-2 items-center'>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='Username'
            minLength={4}
            maxLength={16}
          />
          {username && (
            <div
              className='size-4 rounded-md'
              style={{
                backgroundColor: generateUniqueColorFromUsername(username),
              }}
            />
          )}
        </div>
        {isError && (
          <span className='text-sm text-destructive'>{error.message}</span>
        )}
        <AlertDialogFooter>
          <SpinnerButton
            loading={isPending}
            variant='default'
            onClick={handleSubmit}
          >
            Pick
          </SpinnerButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const Route = createFileRoute('/_layout')({
  component: Layout,
});
