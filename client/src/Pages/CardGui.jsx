import React, { useState, useEffect } from "react";
import axios from "axios";

export default function WalletUI() {
    const [wallet, setWallet] = useState({ balance: 0, bonus: 0, winnings: 0 });
    const [addAmount, setAddAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawPhone, setWithdrawPhone] = useState("");

    // Fetch wallet data
    const fetchWallet = async () => {
        try {

            let apiUrl = `http://localhost:8000/api/getwallet`
            const res = await axios.get(apiUrl);

            console.log("Wallet data:", res.data);
            
            setWallet(res.data);
        } catch (err) {
            console.error("Error fetching wallet:", err);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleAddCash = async () => {
        try {
            await axios.post("/api/add-cash", {
                amount: parseFloat(addAmount),
            });
            setAddAmount("");
            fetchWallet();
        } catch (err) {
            console.error("Error adding cash:", err);
        }
    };

    const handleWithdraw = async () => {
        try {
            await axios.post("/api/withdraw", {
                amount: parseFloat(withdrawAmount),
                phone: withdrawPhone,
            });
            setWithdrawAmount("");
            setWithdrawPhone("");
            fetchWallet();
        } catch (err) {
            console.error("Error withdrawing:", err);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            {/* Wallet Balance */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl p-6 text-white text-center shadow-lg">
                <h2 className="text-lg">Wallet Balance</h2>
                <p className="text-3xl font-bold mt-2">
                    ₹{(wallet.balance ?? 0).toFixed(2)}
                </p>
            </div>

            {/* Add Cash Section */}
            <div className="mt-4 bg-white p-4 rounded-2xl shadow space-y-2">
                <h3 className="font-semibold text-lg">Add Cash</h3>
                <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border p-2 rounded-md"
                />
                <button
                    onClick={handleAddCash}
                    className="w-full bg-green-600 text-white py-2 rounded-md"
                >
                    Add Cash
                </button>
            </div>

            {/* Withdraw Section */}
            <div className="mt-4 bg-white p-4 rounded-2xl shadow space-y-2">
                <h3 className="font-semibold text-lg">Withdraw</h3>
                <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Withdraw amount"
                    className="w-full border p-2 rounded-md"
                />
                <input
                    type="tel"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full border p-2 rounded-md"
                />
                <button
                    onClick={handleWithdraw}
                    className="w-full bg-blue-600 text-white py-2 rounded-md"
                >
                    Withdraw
                </button>
            </div>

            {/* Wallet Breakdown */}
            <div className="mt-4 bg-white p-4 rounded-2xl shadow space-y-4">
                <div className="flex justify-between">
                    <p className="text-gray-600">Bonus</p>
                    <p className="font-medium">
                        ₹{(wallet.bonus ?? 0).toFixed(2)}
                    </p>
                </div>
                <div className="flex justify-between">
                    <p className="text-gray-600">Winnings</p>
                    <p className="font-medium">
                        ₹{(wallet.winnings ?? 0).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}
