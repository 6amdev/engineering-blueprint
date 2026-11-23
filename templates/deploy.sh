#!/usr/bin/env bash
# deploy.sh — ขึ้นระบบแบบสลับ folder ทันที เก็บชุดก่อนหน้าไว้ถอย (docs/deploy.md) · new-project วางไว้ที่ scripts/deploy.sh
#   bash scripts/deploy.sh deploy <uat|prod> <sha>   ส่ง BUILD_DIR (ค่าเริ่มต้น dist) ขึ้น releases/<sha> → สลับ current → เช็ค → ไม่ผ่านถอยเอง
#   bash scripts/deploy.sh rollback <uat|prod>       สลับ current กลับไปชุดก่อนหน้า → เช็ค
# ค่าที่ต้องมี (GitHub environment secrets หรือ env ในเครื่อง): DEPLOY_HOST · DEPLOY_USER · DEPLOY_SSH_KEY · DEPLOY_KNOWN_HOSTS · DEPLOY_PATH · HEALTH_URL
# บน server: เว็บหรือ service ชี้ไปที่ <DEPLOY_PATH>/current · user นี้เขียน DEPLOY_PATH ได้ ไม่ต้องใช้ sudo
# กรอกต่อโปรเจกต์: ระบบที่ไม่ได้ขึ้นแบบ ssh + ไฟล์ (cloud · container) แก้ฟังก์ชัน upload / swap ให้ตรง แต่คงลำดับ ขึ้น → เช็ค → ถอยเมื่อไม่ผ่าน
#   service ที่ต้อง restart หลังสลับ: เติมคำสั่งใน after_swap
set -euo pipefail
action=${1:-}; target=${2:-}; sha=${3:-}
case "$action:$target" in deploy:uat|deploy:prod|rollback:uat|rollback:prod) ;; *) echo "ใช้: deploy.sh deploy|rollback uat|prod [sha]"; exit 2 ;; esac
for v in DEPLOY_HOST DEPLOY_USER DEPLOY_SSH_KEY DEPLOY_KNOWN_HOSTS DEPLOY_PATH HEALTH_URL; do
  [ -n "${!v:-}" ] || { echo "ยังไม่ได้ตั้ง $v ของ $target (GitHub → Settings → Environments → $target → secrets)"; exit 2; }
done
[[ "$DEPLOY_PATH" =~ ^/[A-Za-z0-9._/-]+$ ]] || { echo "DEPLOY_PATH ต้องเป็น path เต็ม ไม่มีช่องว่างหรืออักขระพิเศษ"; exit 2; }

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$tmp/key"; printf '%s\n' "$DEPLOY_KNOWN_HOSTS" > "$tmp/known_hosts"; chmod 600 "$tmp/key"
SSH="ssh -i $tmp/key -o UserKnownHostsFile=$tmp/known_hosts -o StrictHostKeyChecking=yes -o BatchMode=yes"
remote() { $SSH "$DEPLOY_USER@$DEPLOY_HOST" "$@"; }
upload() { remote "mkdir -p $DEPLOY_PATH/releases/$1" && rsync -a --delete -e "$SSH" "$BUILD/" "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/releases/$1/"; }
swap() { remote "cd $DEPLOY_PATH && ln -sfn releases/$1 current.tmp && mv -T current.tmp current"; after_swap; } # mv -T = สลับทีเดียว ไม่มีช่วงที่ไม่มี current
after_swap() { :; } # กรอกต่อโปรเจกต์: เช่น remote "systemctl --user restart app"
health() { for _ in 1 2 3 4 5 6; do curl -fsS -o /dev/null --max-time 10 "$HEALTH_URL" && return 0; sleep 5; done; return 1; }
current() { remote "readlink $DEPLOY_PATH/current 2>/dev/null | sed 's|^releases/||'" | grep -E '^[0-9a-f]{7,40}$' || true; } # รับเฉพาะชื่อที่เป็น sha

if [ "$action" = deploy ]; then
  [[ "$sha" =~ ^[0-9a-f]{7,40}$ ]] || { echo "sha ไม่ถูกต้อง: $sha"; exit 2; }
  BUILD=${BUILD_DIR:-dist}; [ -d "$BUILD" ] || { echo "ไม่พบ $BUILD (build ก่อน หรือตั้ง BUILD_DIR)"; exit 2; }
  prev=$(current)
  upload "$sha"; swap "$sha"
  if health; then
    [ -n "$prev" ] && [ "$prev" != "$sha" ] && remote "echo $prev > $DEPLOY_PATH/previous"
    remote "cd $DEPLOY_PATH/releases && ls -1t | grep -vx -e $sha -e '${prev:-none}' | tail -n +2 | xargs -r rm -rf" # เก็บ current · previous · อีก 1 ชุด
    echo "ขึ้น $target $sha แล้ว · เช็คผ่าน"
  else
    echo "เช็คไม่ผ่าน $HEALTH_URL"
    if [ -n "$prev" ]; then swap "$prev"; echo "ถอยกลับ $prev แล้ว"; else echo "ไม่มีชุดก่อนหน้าให้ถอย"; fi
    exit 1
  fi
else
  prev=$(remote "cat $DEPLOY_PATH/previous 2>/dev/null" || true)
  [[ "$prev" =~ ^[0-9a-f]{7,40}$ ]] || { echo "ไม่มีชุดก่อนหน้าให้ถอย"; exit 1; }
  now=$(current); swap "$prev"
  [ -n "$now" ] && remote "echo $now > $DEPLOY_PATH/previous"
  if health; then echo "ถอย $target กลับ $prev แล้ว · เช็คผ่าน"; else echo "ถอยแล้วแต่เช็คไม่ผ่าน $HEALTH_URL — แจ้ง Ops ตาม runbook"; exit 1; fi
fi
