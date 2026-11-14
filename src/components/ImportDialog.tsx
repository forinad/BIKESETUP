import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { decodeShared, encodeShared } from '../lib/share'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const openShared = () => {
    const payload = decodeShared(text)
    if (!payload) {
      setError('Не похоже на код BIKESETUP. Вставьте код вида BS1-… или полную ссылку.')
      return
    }
    setError('')
    const code = encodeShared(payload)
    onClose()
    setText('')
    navigate(`/share/${encodeURIComponent(code)}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Открыть по коду"
      subtitle="Вставьте код, который прислал друг, или ссылку целиком. Ничего не импортируется без подтверждения."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" icon={<Icon name="external" size={14} />} onClick={openShared}>
            Посмотреть
          </Button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError('')
        }}
        placeholder="BS1-N4Igzg… или https://…/#/share/BS1-N4Igzg…"
        className="field h-32 resize-none break-all font-mono text-[10.5px]"
        autoFocus
      />
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-danger">
          <Icon name="alert" size={13} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-dim">
        Код содержит байк, сетап и данные райдера. Если такой байк уже есть в гараже, сетап
        добавится к нему, иначе появится новый байк.
      </p>
    </Modal>
  )
}
