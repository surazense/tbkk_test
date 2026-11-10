import MachineCardsBoard from "@/components/machines/MachineCardsBoard";

export default function MachinesPage() {
  return (
    <div className="space-y-4 bg-[#0B1121] px-2 py-3 sm:px-4 sm:py-4">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-3xl">Machines</h1>
        <p className="text-sm text-gray-400">Health of each machine. Click a card for details.</p>
      </div>
      <MachineCardsBoard />
    </div>
  );
}
