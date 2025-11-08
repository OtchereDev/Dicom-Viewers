import React from 'react';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

const NavBar = ({
  className,
  children,
  isSticky,
}: {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
}) => {
  return (
    <div
      className={classnames(
        'z-20 border-b border-[#2b3b6e] bg-gradient-to-r from-[#0a163f] via-[#111d48] to-[#1a2654] px-2 shadow-md',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

export default NavBar;
