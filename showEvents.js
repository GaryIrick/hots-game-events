const parser = require('hots-parser')

const loopsToGameSeconds = (loops) => {
  return (loops - 610) / 16
}

const getPlayers = (match) => {
  const players = []

  for (const teamIndex in match.teams) {
    for (let i = 0; i < match.teams[teamIndex].ids.length; i++) {
      players.push({
        name: match.teams[teamIndex].names[i],
        hero: match.teams[teamIndex].heroes[i]
      })
    }
  }

  return players
}

const run = (filename) => {
  const parse = parser.processReplay(filename, { getBMData: true, overrideVerifiedBuild: true })
  if (parse.status !== 1) {
    console.log(`Parser returns status ${parse.status}.`)
    return
  }

  const data = parser.parse(filename, parser.AllReplayData)
  const players = getPlayers(parse.match)

  for (const playerIndex in players) {
    console.log(`${playerIndex < 5 ? 'Blue' : 'Red'}: ${players[playerIndex].hero} is ${players[playerIndex].name}`)
  }

  for (const evt of data.trackerevents) {
    if (evt.m_eventName === 'TalentChosen') {
      const time = loopsToGameSeconds(evt._gameloop)
      const playerIndex = evt.m_intData[0].m_value - 1
      const talent = evt.m_stringData[0].m_value
      console.log(`${time}: ${players[playerIndex].hero} picked ${talent}`)
    } else if (evt.m_eventName === 'LevelUp') {
      const time = loopsToGameSeconds(evt._gameloop)
      const playerIndex = evt.m_intData[0].m_value - 1
      const level = evt.m_intData[1].m_value
      console.log(`${time}: ${players[playerIndex].hero} hit level ${level}`)
    } else if (evt.m_eventName === 'PlayerDeath') {
      const time = loopsToGameSeconds(evt._gameloop)
      const playerIndex = evt.m_intData[0].m_value - 1
      const killers = evt.m_intData
        .filter(d => d.m_key === 'KillingPlayer' && d.m_value > 0)
        .map(d => players[d.m_value - 1].hero)

      if (killers.length === 0) {
        killers.push('Nexus forces')
      }

      console.log(`${time}: ${players[playerIndex].hero} killed by ${killers.join(', ')}`)
    }
  }
}

if (process.argv.length !== 3) {
  console.log('Usage: node parseReplay.js <filename>')
  process.exit(1)
}

run(process.argv[2])
