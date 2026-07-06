#!/bin/bash
sed -i "s/import { ALDDatabase, hashPassword, dbSaveUser, compressBase64Image } from '..\/data';/import { ALDDatabase, hashPassword, compressBase64Image } from '..\/data';\nimport { dbSaveUser } from '..\/firebase';/" src/hooks/useFirestoreSync.ts
