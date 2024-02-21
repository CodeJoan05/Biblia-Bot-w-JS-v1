const { Client, Intents, MessageEmbed} = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const config = require("./config.json");
const BG = require("./BG.json");
const fs = require("fs");

// Informacja o logowaniu i aktywności na Discordzie

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('Biblię Gdańską', {type: "WATCHING" });
})

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Wykrywanie komendy na początku, w środku i na końcu zdania
  const commandRegex = /\b(\d*\s*\w+(?:\s*\w+)*)\s+(\d+):(\d+(-\d+)?)\b/g;
  const matches = message.content.matchAll(commandRegex);

  for (const match of matches) {
    const book = getBook(match[1].trim()); // Uzyskanie kanonicznej nazwy księgi z obiektu NameBooks

    if (!book || !(book in BG)) continue;

    const chapter = match[2];
    const range = match[3].split("-");

    let text = "";

    if (range.length > 1) {
      let verseRangeStart = parseInt(range[0]);
      let verseRangeEnd = parseInt(range[1]);

    if (verseRangeStart > verseRangeEnd) {
      const errorEmbed = new MessageEmbed()
        .setColor('#FF0000') // Czerwony kolor
        .setTitle('Błąd')
        .setDescription('Nieprawidłowy zakres wersetów. Początkowy numer wersetu powinien być mniejszy lub równy końcowemu numerowi wersetu.');
      return message.channel.send({ embeds: [errorEmbed] });
    }

    // Obsługa wielu wersetów
    for (let i = verseRangeStart; i <= verseRangeEnd; i++) {

        if (BG[book][chapter] && BG[book][chapter][i]) {
          text += `**(${i})** ${BG[book][chapter][i]} `;
        }
      }
    } else {
        // Obsługa pojedynczego wersetu
        if (BG[book][chapter] && BG[book][chapter][range[0]]) {
          text = BG[book][chapter][range[0]];
      }
    }

    if (text) {
      const maxLength = 3000; // Ustawienie maksymalnej wielkości pojedynczej wiadomości
      let chunks = [];

      // Dzieli tekst na kawałki o długości maxLength i dodaje je do tablicy chunks
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substr(i, maxLength));
      }

      // Wysyłanie wiadomości Embed
      for (let i = 0; i < chunks.length; i++) {
        const exampleEmbed = new MessageEmbed()
          .setColor(12370112) // Jasno-szary kolor
          .setTitle(`**${book} ${chapter}:${match[3]}**`)
          .setDescription(`${chunks[i]}`)
          .setFooter({ text: "Biblia Gdańska (1881)" });
        await message.channel.send({ embeds: [exampleEmbed] });
      }
    }
  }
});


function getBook(alias) {
  
  try {
  const booksData = fs.readFileSync("./books.json"); // Odczytywanie danych z pliku books.json
  const bookAliases = JSON.parse(booksData).NameBooks; // Przetwarzanie danych z JSON i dostęp do obiektu NameBooks

  for (const [book, aliases] of Object.entries(bookAliases)) {
        if (aliases.includes(alias.toLowerCase())) { // Konwertuje alias na małe litery w celu dopasowania bez uwzględniania wielkości liter
          return book;
        }
      }
      return null;
    } 
    catch (error) {
      console.error("Error reading or parsing 'books.json':", error);
      return null;
  }
}

client.login(config.BOT_TOKEN);