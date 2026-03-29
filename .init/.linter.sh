#!/bin/bash
cd /home/kavia/workspace/code-generation/elegant-dance-studio-website-242614-242625/nextjs_tailwind_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

