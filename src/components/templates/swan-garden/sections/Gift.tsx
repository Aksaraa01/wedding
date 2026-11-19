"use client"

import { useCallback, useState } from "react"
import { copyPlainText } from "@/lib/clipboard"
import { Backdrop } from "../Ornaments"
import { gift0, gift1, gift2 } from "../ornamentData"
import { SG } from "../assets"

type Account = { provider_name?: string; account_number?: string; account_name?: string; type?: string }

type Props = {
  accounts: Account[]
  addressName: string
  address: string
  title: string
  intro: string
  addressTitle: string
  copyLabel: string
  copiedLabel: string
  showAddress: boolean
}

export default function Gift({
  accounts,
  addressName,
  address,
  title,
  intro,
  addressTitle,
  copyLabel,
  copiedLabel,
  showAddress,
}: Props) {
  const list = accounts.filter((a) => a.account_number || a.provider_name)
  const showAddressBlock = showAddress && Boolean(address || addressName)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = useCallback(async (value: string, key: string) => {
    const ok = await copyPlainText(value)
    setCopied(ok ? key : null)
    window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800)
  }, [])

  if (!list.length && !showAddressBlock) return null

  return (
    <section className="wedding-gift-wrap ">
      <div className="wedding-gift-inner">
        <Backdrop items={gift0} />
        <div className="wg-frame">
          <div className="image-wrap">
            <img src={SG.frameQuote} alt="" aria-hidden="true" loading="eager" width={1200} height={1112} />
          </div>
          <Backdrop items={gift1} />
          <Backdrop items={gift2} />
        </div>
        <div className="wedding-gift-head">
          <h1 className="wedding-gift-title">{title}</h1>
          {intro ? <p className="wedding-gift-description">{intro}</p> : null}
        </div>
        <div className="wedding-gift-body-wrap">
          <div className="wedding-gift-body ">
            <div className="wedding-gift-body-inner">
              <div className="wedding-gift-form">
                <div className="wedding-gift-details wedding-gift__first-slide wedding-gift-slide">
                  {list.map((account, i) => {
                    const number = account.account_number || ""
                    return (
                      <div className="accor-bank-wrap accor-active" key={i}>
                        <div className="bank-btn-accordion bankBtnAccordion">
                          <p className="bank-btop-txt">{account.provider_name || ""}</p>
                          <span className="bank-caret" aria-hidden="true" />
                        </div>
                        <div className="wedding-gift-bank-wrap bankItemAccordion">
                          <div className="bank-item">
                            <h3 className="bank-name">{account.provider_name || ""}</h3>
                            <div className="bank-detail">
                              <p className="bank-account-number-label">
                                Account Number: <span className="bank-account-number">{number}</span>
                              </p>
                              {account.account_name ? (
                                <p className="bank-account-name-label">
                                  Account Name: <span className="bank-account-name">{account.account_name}</span>
                                </p>
                              ) : null}
                              <div className="bank-button-wrap">
                                <button type="button" onClick={() => copy(number, `bank-${i}`)} aria-label={`${copyLabel} ${number}`}>
                                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    <rect x="9" y="9" width="11" height="11" rx="2" />
                                    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                                  </svg>
                                  <span>{copied === `bank-${i}` ? copiedLabel : copyLabel}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {showAddressBlock ? (
                    <div className="sw-gift__address">
                      <h3 className="bank-name">{addressTitle}</h3>
                      {addressName ? <p className="sw-gift__address-name">{addressName}</p> : null}
                      <p className="sw-gift__address-body">{address}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
