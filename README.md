<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Змейки и Лестницы</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Онлайн игра Змейки и Лестницы">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <h1>Змейки и Лестницы</h1>
  <div id="gameBoard"></div>

  <div class="controls">
    <div id="dice">?</div>
    <button id="rollBtn">Бросить кубик</button>
    <button id="moveBtn" disabled>Ход</button>
    <button id="resetBtn">Сброс</button>
    <p>Позиция: <span id="positionValue">1</span></p>
  </div>

  <script src="js/game.js" defer></script>
</body>
</html>
