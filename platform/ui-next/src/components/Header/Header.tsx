import React, { ReactNode } from 'react';
import classNames from 'classnames';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
} from '../';
import { IconPresentationProvider } from '@ohif/ui-next';

import NavBar from '../NavBar';

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
  UndoRedo?: ReactNode;
}

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  UndoRedo,
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        <div className="relative h-[48px] items-center bg-gradient-to-r from-[#0a163f] via-[#111d48] to-[#1a2654] text-white shadow-md">
          <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center">
            <div
              className={classNames(
                'mr-3 inline-flex items-center transition-transform duration-150 hover:scale-105',
                isReturnEnabled && 'cursor-pointer'
              )}
              onClick={onClickReturn}
              data-cy="return-to-work-list"
            >
              {isReturnEnabled && <Icons.ArrowLeft className="ml-1 h-7 w-7 text-[#c4d82e]" />}
              <div className="ml-2">
                {WhiteLabeling?.createLogoComponentFn?.(React, props) || (
                  <Icons.OHIFLogo className="text-[#c4d82e]" />
                )}
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-[250px] h-8 -translate-y-1/2 font-medium text-[#c4d82e]">
            {Secondary}
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="flex items-center justify-center space-x-2 text-[#f2f4f8]">
              {children}
            </div>
          </div>

          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
            {UndoRedo}
            <div className="mx-1.5 h-[25px] border-r border-[#2b3b6e]"></div>
            {PatientInfo}
            <div className="mx-1.5 h-[25px] border-r border-[#2b3b6e]"></div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-2 h-full w-full text-[#c4d82e] transition-colors hover:bg-[#1f2b5a] hover:text-[#e6ef70]"
                  >
                    <Icons.GearSettings />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border border-[#2b3b6e] bg-[#0e1535] text-white shadow-lg"
                >
                  {menuOptions.map((option, index) => {
                    const IconComponent = option.icon
                      ? Icons[option.icon as keyof typeof Icons]
                      : null;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={option.onClick}
                        className="flex items-center gap-2 py-2 transition-colors hover:bg-[#1a2654] hover:text-[#c4d82e]"
                      >
                        {IconComponent && (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <Icons.ByName
                              name={option.icon}
                              className="text-[#c4d82e]"
                            />
                          </span>
                        )}
                        <span className="flex-1">{option.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
