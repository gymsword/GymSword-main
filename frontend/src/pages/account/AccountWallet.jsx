import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AccountWallet() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    api.get("/auth/wallet").then(({ data }) => {
      setWallet(data);
    });
  }, []);

  if (!wallet) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="font-display uppercase font-black text-4xl mb-8">
        My Wallet
      </h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#F5F5F7] p-6">
          <p className="text-sm text-black/60">Available Coins</p>
          <h2 className="text-3xl font-black">
            {wallet.availableCoins}
          </h2>
        </div>

        <div className="bg-[#F5F5F7] p-6">
          <p className="text-sm text-black/60">Earned Coins</p>
          <h2 className="text-3xl font-black">
            {wallet.totalEarnedCoins}
          </h2>
        </div>

        <div className="bg-[#F5F5F7] p-6">
          <p className="text-sm text-black/60">Referral Coins</p>
          <h2 className="text-3xl font-black">
            {wallet.referralCoins}
          </h2>
        </div>

        <div className="bg-[#F5F5F7] p-6">
          <p className="text-sm text-black/60">Membership</p>
          <h2 className="text-2xl font-black">
            {wallet.membershipLevel}
          </h2>
        </div>
      </div>

      <div className="border border-black/10 p-6">
        <h2 className="font-display text-2xl mb-6">
          Coin History
        </h2>

        {wallet.transactions?.map((tx) => (
          <div
            key={tx._id}
            className="flex justify-between py-3 border-b"
          >
            <span>{tx.description}</span>
            <span className="font-semibold">
              {tx.coins > 0 ? "+" : ""}
              {tx.coins}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}