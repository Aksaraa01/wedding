"use client"

import { useState } from "react"

type Account = {
  provider_name?: string
  account_number?: string
  account_name?: string
  type?: string
}

type Props = {
  accounts: Account[]
  address?: string
  addressName?: string
  intro: string
  lang?: "EN" | "ID" | "id" | "en"
  language?: "id" | "en" | string
  onCopy: (text: string) => void
}

export default function Gift({ accounts, address, addressName, intro, lang: langProp, language, onCopy }: Props) {
  const lang = ((): "id"|"en" => { const v = (language || langProp || "id").toString().toLowerCase(); return v === "en" ? "en" : "id" })()
  const [tab, setTab] = useState<"angpao" | "registry">(accounts.length > 0 ? "angpao" : "registry")
  const hasRegistry = !!address

  return (
    <div className="aj-gift">
      <p className="aj-gift__intro">{intro}</p>
      <div className="aj-gift__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "angpao"}
          className={tab === "angpao" ? "is-active" : ""}
          onClick={() => setTab("angpao")}
        >
          E-Angpao
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "registry"}
          className={tab === "registry" ? "is-active" : ""}
          onClick={() => setTab("registry")}
        >
          {lang === "id" ? "Daftar Hadiah" : "Gift Registry"}
        </button>
      </div>

      {tab === "angpao" && (
        <div className="aj-gift__panel">
          {accounts.length === 0 && (
            <p className="aj-gift__empty">
              {lang === "id" ? "Belum ada rekening yang ditambahkan." : "No accounts have been added yet."}
            </p>
          )}
          {accounts.map((account, i) => (
            <article key={`${account.account_number || "account"}-${i}`} className="aj-gift__account">
              <p className="aj-gift__bank">{account.provider_name}</p>
              <p className="aj-gift__number">{account.account_number}</p>
              <p className="aj-gift__holder">{account.account_name}</p>
              <button
                type="button"
                className="aj-gift__copy"
                onClick={() => onCopy(account.account_number || "")}
                disabled={!account.account_number}
              >
                {lang === "id" ? "Salin Nomor" : "Copy Number"}
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === "registry" && (
        <div className="aj-gift__panel">
          {hasRegistry ? (
            <article className="aj-gift__address">
              <p className="aj-gift__bank">{lang === "id" ? "Kirim Hadiah" : "Send a Gift"}</p>
              <p className="aj-gift__addr-text">{address}</p>
              {addressName && <p className="aj-gift__holder">{addressName}</p>}
              <button type="button" className="aj-gift__copy" onClick={() => onCopy(address || "")}>
                {lang === "id" ? "Salin Alamat" : "Copy Address"}
              </button>
            </article>
          ) : (
            <p className="aj-gift__empty">
              {lang === "id" ? "Alamat pengiriman hadiah belum ditambahkan." : "No gift address has been added yet."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
