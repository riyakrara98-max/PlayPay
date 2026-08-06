while pgrep -f "npx tsc --noEmit" > /dev/null; do sleep 1; done
echo "Done"
