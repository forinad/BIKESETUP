import { useMemo, useState } from 'react'
import type { SharedPayload } from '../types'
import { encodeShared, shareUrl } from '../lib/share'
import { copyText } from '../lib/clipboard'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

export function ShareDialog({
  open,
  onClose,
  payload,
}: {
  open: boolean
  onClose: () => void
  payload: SharedPayload | null
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const code = useMemo(() => (payload ? encodeShared(payload) : ''), [payload])
  const link = useMemo(() => (code ? shareUrl(code) : ''), [code])

  const copy = async (kind: 'code' | 'link') => {
    const ok = await copyText(kind === 'code' ? code : link)
    if (ok) {
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
    }
  }

  const nativeShare = async () => {
    if (!payload) return
    try {
      await navigator.share?.({
        title: `BIKESETUP · ${payload.bike.name}`,
        text: payload.name,
        url: link,
      })
    } catch {
      /* пользователь отменил */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Поделиться сетапом"
      subtitle="Код или ссылка открывает байк и сетап в режиме просмотра. Получатель сможет добавить их к себе в гараж."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Готово
        </Button>
      }
    >
      {!payload ? (
        <p className="text-[12px] text-dim">Сначала сохраните сетап — делиться пока нечем.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<Icon name="copy" size={14} />} onClick={() => copy('code')}>
              {copied === 'code' ? 'Скопировано' : 'Копировать код'}
            </Button>
            <Button variant="secondary" icon={<Icon name="link" size={14} />} onClick={() => copy('link')}>
              {copied === 'link' ? 'Ссылка скопирована' : 'Копировать ссылку'}
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button variant="ghost" icon={<Icon name="share" size={14} />} onClick={nativeShare}>
                Отправить
              </Button>
            )}
          </div>

          <div>
            <span className="eyebrow-plain mb-1.5 block text-[10px] text-muted">Код сетапа</span>
            <textarea
              readOnly
              value={code}
              onFocus={(e) => e.currentTarget.select()}
              className="field h-28 resize-none break-all font-mono text-[10px] leading-relaxed text-muted"
            />
            <p className="mt-1.5 text-[10.5px] text-dim">
              {code.length} символов · версия формата 1 · без сервера, вся инфа внутри кода.
            </p>
          </div>

          <div className="panel-flat p-3">
            <p className="text-[11px] leading-relaxed text-muted">
              {payload.bike.name} · {payload.rider.name} · {payload.rider.weightKg} кг
              {payload.notes ? ` · ${payload.notes}` : ''}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
