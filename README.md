
# bot
## crediting
you must credit me or i'll be sad ~~also i'll get your bot taken down if i find it~~

## installation
**requires an openai beta key**

**requires a stripe account if you want users to purchase tokens**

    curl https://api.openai.com/v1/files -H "Authorization: Bearer ${OPENAI-KEY}" -F purpose="answers" -F file="@botdata.json1"

    git clone https://github.com/RoseChilds/gpt3-discord.git
    cd gpt3-discord
    npm i
create a file called `config.json`, copy over the contents of `config.json.template` and fill out all the sections.
## running
pm2 (recommended)

    npm i pm2 -g
    pm2 start index.js
normal

    npm start



## perms

0. User
1. Helper
2. Moderator
3. Admin
4. Owner
