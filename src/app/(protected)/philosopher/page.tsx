import { getPhilosophers } from "@/actions/philosopher";
import { PhilosophersList } from "./PhilosopherList";
export default async function Home() {
  const philosophers = await getPhilosophers();
  return (
    <div className="flex min-h-screen flex-col items-center justify-around p-32">
      <div>
        <p className="text-center text-4xl">Virtual Philosophers</p>
      </div>
      <div className="flex flex-row items-center justify-evenly">
        <PhilosophersList philosophers={philosophers} />
      </div>
    </div>
  );
}
