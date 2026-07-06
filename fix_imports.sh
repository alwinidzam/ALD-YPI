#!/bin/bash
sed -i 's/import { ReactNode, useState, useEffect, useRef } from '\''react'\'';/import React, { ReactNode, useState, useEffect, useRef } from '\''react'\'';/' src/hooks/useFirestoreSync.ts || sed -i '1s/^/import React from "react";\n/' src/hooks/useFirestoreSync.ts

sed -i 's/import { Bell,/import { Bell, Building2, Users, CalendarDays,/' src/App.tsx
