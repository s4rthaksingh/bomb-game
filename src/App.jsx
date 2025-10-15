import { useEffect, useState } from "react";
import { socket } from "./socket";

export default function App() {
  const [state, setState] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState(null);

  const leaderName = state?.players.find((p) => p.id === state.leader)?.name;

  function findPlayerNamebyID(id) {
    const player = state.players.find((p) => p.id === id);
    return player ? player.name : "Unknown";
  }

  useEffect(() => {
    socket.on("state", setState);
    return () => socket.off("state");
  }, []);

  function giveBomb(player) {
    socket.emit("giveBomb", player);
  }

  function handleJoinGame() {
    if (state.players.some((p) => p.name === playerName)) {
      setError("This player already exists");
      return;
    } else {
      socket.emit("joinGame", playerName.trim());
      setHasJoined(true);
    }
  }

  if(!hasJoined) return(
    <div className="flex flex-col justify-center items-center h-screen w-screen gap-8">
      <h1>Enter a username</h1>
      <input 
        type="text" 
        value={playerName} 
        onChange={(e) => setPlayerName(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md text-white focus:outline-none focus:border-gray-400"
      />
      <button 
        onClick={handleJoinGame} 
        disabled={!state || !playerName.trim()}
        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
      >
        Join
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )

  if (state && !state.gameActive && state.leader === socket.id)
    return (
      <div className="flex h-screen w-screen">
      <div className="flex flex-col justify-center items-center gap-10 w-7/10">
        <h1>You are the leader</h1>
        <button onClick={() => socket.emit("startGame")}>Start game</button>
      </div>

      <div className="flex flex-col justify-center items-center">
          <p className="text-3xl mb-5">Players </p><br /><br />
            <ol className="list-decimal list-inside">
              {state.players.map(p => {
                return <li key={p.id}>{p.name} {state.bombHolder===p.id && "💣" }</li>
              })}
            </ol>
        </div>
      </div>
    );
  else if (state && !state.gameActive) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-screen gap-10">
        <h1>Waiting for {leaderName} to start the game...</h1>
      </div>
    );
  } else if (state && state.gameActive)
    return (
      <>
      <div className="flex h-screen w-screen">
        <div className="flex flex-col justify-center items-center gap-10 w-7/10">
          <h2 className="text-2xl"><b>{findPlayerNamebyID(state.bombHolder)}</b> currently holds the bomb</h2>
          <h1>{state.bombHolder === socket.id && "💣"}</h1>
          {state.bombHolder === socket.id &&
            !state.loser &&
            state.players
              .filter((player) => player.id !== socket.id)
              .map((player) => {
                return (
                  <button key={player.id} onClick={() => giveBomb(player.id)}>
                    Give bomb to {player.name}
                  </button>
                );
              })}
          {state.loser && <h2 className="text-2xl">{findPlayerNamebyID(state.loser)} exploded !!</h2>}
          {state.loser && <h2 className="text-1xl">New game starts soon...</h2>}
        </div>

        <div className="flex flex-col justify-center items-center">
          <p className="text-3xl mb-5">Players </p><br /><br />
            <ol className="list-decimal list-inside">
              {state.players.map(p => {
                return <li key={p.id}>{p.name} {state.bombHolder===p.id && "💣" }</li>
              })}
            </ol>
        </div>

      </div>
    </>
    );
}
