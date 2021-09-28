import '../styles/layout.css'
import '../styles/document.css'
import '../styles/search.css'
import '../styles/content.css'
import Head from 'next/head'
import { useEffect } from 'react'
import { registerDateTooltips } from '../lib/dateHighligher'

export default function MyApp({ Component, pageProps }) {
    useEffect(() => {
        registerDateTooltips()
    }, [])

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
            </Head>
            <Component {...pageProps} />
        </>
    )
}
