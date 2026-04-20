import Image from "next/image";

export function Logo({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/codev.png"
      alt="Codev"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
