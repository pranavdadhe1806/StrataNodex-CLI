import React, { useState } from 'react'
import { render, Box, Text, useApp } from 'ink'
import TextInput from 'ink-text-input'
import { login, verify2FA } from '../api/client.js'
import { saveToken } from '../utils/auth.js'
import { ApiError } from '../api/ApiError.js'
import chalk from 'chalk'

type Step = 'email' | 'password' | '2fa' | 'done'

const LoginFlow: React.FC = () => {
  const { exit } = useApp()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFaUserId, setTwoFaUserId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleEmailSubmit = (value: string) => {
    if (!value.trim()) {
      setErrorMsg('✗ Email cannot be empty.')
      return
    }
    setErrorMsg('')
    setEmail(value)
    setStep('password')
  }

  const handlePasswordSubmit = async (value: string) => {
    if (!value) {
      setErrorMsg('✗ Password cannot be empty.')
      return
    }
    setPassword(value)
    setErrorMsg('')
    try {
      const response = await login(email, value)
      if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
        setTwoFaUserId(response.userId)
        setStep('2fa')
      } else if ('token' in response) {
        saveToken(response.token)
        console.log(chalk.green(`✓ Logged in as ${response.user.email}`))
        setStep('done')
        exit()
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) setErrorMsg('✗ Invalid email or password.')
        else if (err.statusCode === 429) setErrorMsg('✗ Too many login attempts. Wait a moment.')
        else setErrorMsg(`✗ ${err.message}`)
      } else {
        setErrorMsg('✗ Unexpected error.')
      }
      setStep('email')
      setEmail('')
      setPassword('')
    }
  }

  const handleOtpSubmit = async (value: string) => {
    setOtpCode(value)
    setErrorMsg('')
    try {
      const result = await verify2FA(twoFaUserId, value)
      saveToken(result.token)
      console.log(chalk.green(`✓ Logged in as ${result.user.email}`))
      setStep('done')
      exit()
    } catch (err) {
      if (err instanceof ApiError) setErrorMsg(`✗ ${err.message}`)
      else setErrorMsg('✗ Unexpected error.')
      setOtpCode('')
    }
  }

  return (
    <Box flexDirection="column">
      {step === 'email' && (
        <Box>
          <Text bold>Email: </Text>
          <TextInput value={email} onChange={setEmail} onSubmit={handleEmailSubmit} />
        </Box>
      )}
      {step === 'password' && (
        <Box>
          <Text bold>Password: </Text>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handlePasswordSubmit}
            mask="*"
          />
        </Box>
      )}
      {step === '2fa' && (
        <Box flexDirection="column">
          <Text>Two-factor authentication required.</Text>
          <Box>
            <Text bold>Enter your 6-digit code: </Text>
            <TextInput value={otpCode} onChange={setOtpCode} onSubmit={handleOtpSubmit} />
          </Box>
        </Box>
      )}
      {errorMsg !== '' && <Text color="red">{errorMsg}</Text>}
    </Box>
  )
}

export async function runLogin(): Promise<void> {
  const { waitUntilExit } = render(<LoginFlow />)
  await waitUntilExit()
}
