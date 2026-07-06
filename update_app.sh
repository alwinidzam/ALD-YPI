#!/bin/bash
sed -i 's/setIsUsersLoading(true);/if (users.length === 0) setIsUsersLoading(true);/' src/App.tsx
