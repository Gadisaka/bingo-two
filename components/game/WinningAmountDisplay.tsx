"use client";

import img from "../../public/10944902.png";

interface WinningAmountDisplayProps {
  amount: number | null;
}

export const WinningAmountDisplay = ({ amount }: WinningAmountDisplayProps) => {
  return (
    <div className="flex gap-2 items-start justify-between">
      <div className="relative text-start z-10 h-full flex flex-col justify-center font-acme">
        <div className="text-white text-5xl font-bold ">WIN MONEY</div>
        <div className="text-white text-5xl font-bold ">{amount} BIRR</div>
      </div>
      <img src={img.src} alt="win" className="w-50 h-50 " />
    </div>
  );
};
