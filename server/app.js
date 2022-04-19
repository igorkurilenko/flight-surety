const app = require('express')();
const simulation = require('./simulation');

simulation.run();

app.get('/', async (req, res) => {
  if (!simulation.initialized && simulation.error) {
    console.error(simulation.error);
    return res.sendStatus(500);
  }

  if (!simulation.initialized) {
    return res.send({
      ok: false,
      message: "intializing..."
    });
  }

  const oraclesNumber = simulation.getOraclesNumber();

  res.send({
    ok: true,
    oraclesNumber: oraclesNumber
  });
});

app.listen(3000, () => console.log('Listening on port 3000'))